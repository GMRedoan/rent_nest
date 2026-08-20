import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { getBkashIdToken } from "../../lib/bkash";

export const createPayment = async (
  rentalRequestId: string,
  tenantId: string,
) => {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: {
      id: rentalRequestId,
    },
    include: {
      property: true,
    },
  });

  if (!rentalRequest) {
    throw new Error("rental request not found");
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new Error("you are not authorized to pay for this request");
  }

  if (rentalRequest.status !== "APPROVED") {
    throw new Error("payment can only be made for approved rental requests");
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      rentalRequestId,
      status: {
        in: ["PENDING", "PAID"],
      },
    },
  });

  if (existingPayment?.status === "PAID") {
    throw new Error("this rental request has already been paid for");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: rentalRequest.property.title,
          },
          unit_amount: Math.round(rentalRequest.property.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${config.app_url}/properties?success=true`,
    cancel_url: `${config.app_url}/dashboard/tenant/myRequests?success=false`,
    metadata: {
      rentalRequestId,
      tenantId,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      amount: rentalRequest.property.price,
      status: "PENDING",
      stripeSessionId: session.id,
      rentalRequestId,
      tenantId,
    },
  });

  return {
    checkoutUrl: session.url,
    paymentId: payment.id,
  };
};

const confirmPayment = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe_webhook_secret as string,
    );
  } catch (err) {
    throw new Error(`webhook signature verification failed: ${err}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment) {
      throw new Error("payment record not found for this session");
    }

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: payment.rentalRequestId },
    });

    if (!rentalRequest) {
      throw new Error("rental request not found for this payment");
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          stripePaymentIntentId: session.payment_intent as string,
        },
      }),

      prisma.property.update({
        where: { id: rentalRequest.propertyId },
        data: { status: "RENTED" },
      }),

      prisma.rentalRequest.updateMany({
        where: {
          propertyId: rentalRequest.propertyId,
          id: { not: rentalRequest.id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      }),

      prisma.rentalRequest.update({
        where: { id: rentalRequest.id },
        data: { status: "APPROVED" },
      }),
    ]);
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "payment_intent.payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id },
      data: { status: "FAILED" },
    });
  }

  return { received: true };
};

const bkashPayment = async () => {
  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw new Error("bkash id token not found");
  }
  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        agreementID: "TokenizedMerchant01L3IKB6H1565072174986",
        mode: "0011",
        payerReference: "01723888888",
        callbackURL: `${config.app_url}/payments/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "1200",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: "Inv0124",
      }),
    },
  );
  const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

  return bkashCreatePaymentResult;
};

const bkashPaymentCallback = async (query: Record<string, any>) => {
  const paymentId = query.paymentID;
  if (!paymentId) {
    throw new Error("payment id not found");
  }
  const status = query.status;
  if (!status) {
    throw new Error("status not found");
  }
  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw new Error("bkash id token not found");
  }
  const executePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        paymentID: paymentId,
        status: status,
      }),
    },
  );
  const executePaymentResult = await executePaymentResponse.json();
  if (status === "success") {
    return {
      executePaymentResult,
      redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?status=success`,
    };
  }
  if (status === "failure") {
    return {
      executePaymentResult,
      redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?status=failure`,
    };
  }
  if (status === "cancel") {
    return {
      executePaymentResult,
      redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?status=cancel`,
    };
  }

  return {
    executePaymentResult,
    redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory`,
  };
};

const paymentHistory = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { tenantId: userId },
    orderBy: { createdAt: "desc" },
  });
  return payments;
};

const singlePaymentHistory = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
      tenantId: userId,
    },
    include: {
      rentalRequest: {
        include: {
          property: true,
        },
      },
    },
  });
  return payment;
};

export const paymentService = {
  createPayment,
  confirmPayment,
  bkashPayment,
  bkashPaymentCallback,
  paymentHistory,
  singlePaymentHistory,
};
