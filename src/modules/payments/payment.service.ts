import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { getBkashIdToken } from "../../lib/bkash";
import { PaymentStatus, PropertyStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const createPayment = async (
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
    throw new AppError(httpStatus.NOT_FOUND, "rental request not found");
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "you are not authorized to pay for this request");
  }

  if (rentalRequest.status !== "APPROVED") {
    throw new AppError(httpStatus.BAD_REQUEST, "payment can only be made for approved rental requests");
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
    throw new AppError(httpStatus.BAD_REQUEST, "this rental request has already been paid for");
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
    success_url: `${config.app_url}/dashboard/tenant/paymentHistory?success=true`,
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
    throw new AppError(httpStatus.BAD_REQUEST, `webhook signature verification failed: ${err}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "payment record not found for this session");
    }

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id: payment.rentalRequestId },
    });

    if (!rentalRequest) {
      throw new AppError(httpStatus.NOT_FOUND, "rental request not found for this payment");
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

const bkashPayment = async (rentalRequestId: string, tenantId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: {
        id: rentalRequestId,
      },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!rentalRequest) {
      throw new AppError(httpStatus.NOT_FOUND, "rental request not found");
    }

    if (rentalRequest.tenantId !== tenantId) {
      throw new AppError(httpStatus.FORBIDDEN, "you are not authorized to pay for this request");
    }

    if (rentalRequest.status !== "APPROVED") {
      throw new AppError(httpStatus.BAD_REQUEST, "payment can only be made for approved rental requests");
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
      throw new AppError(httpStatus.BAD_REQUEST, "this rental request has already been paid for");
    }

    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "bkash id token not found");
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
          mode: "0011",
          payerReference: rentalRequest.tenant.email,
          callbackURL: `${config.backend_url}/payments/callback`,
          amount: rentalRequest.property.price,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: rentalRequest.property.id,
        }),
      },
    );
    const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

    if (
      !bkashCreatePaymentResult.paymentID ||
      !bkashCreatePaymentResult.bkashURL
    ) {
      console.error("BKASH CREATE PAYMENT ERROR:", bkashCreatePaymentResult);

      throw new AppError(
        httpStatus.BAD_REQUEST,
        bkashCreatePaymentResult.statusMessage ||
          "Unable to create bKash payment",
      );
    }

    // create payment model
    await tx.payment.create({
      data: {
        tenantId,
        merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
        rentalRequestId,
        amount: rentalRequest.property.price,
        paymentGateway: "Bkash",
        bkashPaymentId: bkashCreatePaymentResult.paymentID,
      },
    });

    return {
      checkoutUrl: bkashCreatePaymentResult.bkashURL,
    };
  });

  return transactionResult;
};

const bkashPaymentCallback = async (query: Record<string, any>) => {
  const paymentId = query.paymentID;
  const callbackStatus = query.status?.toLowerCase();

  if (!paymentId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment ID not found");
  }

  if (!callbackStatus) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment status not found");
  }

  if (callbackStatus === "failure" || callbackStatus === "cancel") {
    const paymentStatus =
      callbackStatus === "failure"
        ? PaymentStatus.FAILED
        : PaymentStatus.CANCELLED;

    await prisma.payment.updateMany({
      where: {
        bkashPaymentId: paymentId,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: paymentStatus,
      },
    });

    return {
      redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?status=${callbackStatus}`,
    };
  }

  if (callbackStatus !== "success") {
    return {
      redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?error=payment-failed`,
    };
  }

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "bKash ID token not found",
    );
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
      }),
    },
  );

  const executePaymentResult = await executePaymentResponse.json();

  console.log("BKASH EXECUTE RESPONSE:", executePaymentResult);

  if (
    !executePaymentResponse.ok ||
    executePaymentResult.statusCode !== "0000" ||
    executePaymentResult.transactionStatus !== "Completed" ||
    !executePaymentResult.trxID
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      executePaymentResult.statusMessage || "bKash payment execution failed",
    );
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        bkashPaymentId: paymentId,
      },
      include: {
        rentalRequest: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    if (payment.status === PaymentStatus.PAID) {
      return;
    }

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        bkashTrxId: executePaymentResult.trxID,
      },
    });

    await tx.property.update({
      where: {
        id: payment.rentalRequest.property.id,
      },
      data: {
        status: PropertyStatus.RENTED,
      },
    });
  });

  return {
    redirectUrl: `${config.app_url}/dashboard/tenant/paymentHistory?status=success`,
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
