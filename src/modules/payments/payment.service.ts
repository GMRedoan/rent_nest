import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

export const createPayment = async (rentalRequestId: string, tenantId: string) => {
    const rentalRequest = await prisma.rentalRequest.findUnique({
        where: { 
            id: rentalRequestId 
        },
        include: { 
            property: true 
        }
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
                in: ["PENDING",  "PAID"] 
            }
        }
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
                        name: rentalRequest.property.title
                    },
                    unit_amount: Math.round(rentalRequest.property.price * 100)  
                },
                quantity: 1
            }
        ],
        success_url: `${config.app_url}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app_url}/payments/cancel`,
        metadata: {
            rentalRequestId,
            tenantId
        }
    });

    const payment = await prisma.payment.create({
        data: {
            amount: rentalRequest.property.price,
            status: "PENDING",
            stripeSessionId: session.id,
            rentalRequestId,
            tenantId
        }
    });
    
     return { 
        checkoutUrl: session.url, 
        paymentId: payment.id 
    };
};

const confirmPayment = async (rawBody: Buffer, signature: string) => {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            config.stripe_webhook_secret as string
        );
    } catch (err) {
        throw new Error(`webhook signature verification failed: ${err}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const payment = await prisma.payment.findUnique({
            where: { stripeSessionId: session.id }
        });

        if (!payment) {
            throw new Error("payment record not found for this session");
        }

        const rentalRequest = await prisma.rentalRequest.findUnique({
            where: { id: payment.rentalRequestId }
        });

        if (!rentalRequest) {
            throw new Error("rental request not found for this payment");
        }

        await prisma.$transaction([
            prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: "PAID",
                    stripePaymentIntentId: session.payment_intent as string
                }
            }),

            prisma.property.update({
                where: { id: rentalRequest.propertyId },
                data: { status: "RENTED" }
            }),

            prisma.rentalRequest.updateMany({
                where: {
                    propertyId: rentalRequest.propertyId,
                    id: { not: rentalRequest.id },
                    status: "PENDING"
                },
                data: { status: "REJECTED" }
            }),

            prisma.rentalRequest.update({
                where: { id: rentalRequest.id },
                data: { status: "APPROVED" }
            })
        ]);
    }

    if (
        event.type === "checkout.session.expired" ||
        event.type === "payment_intent.payment_failed"
    ) {
        const session = event.data.object as Stripe.Checkout.Session;

        await prisma.payment.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "FAILED" }
        });
    }

    return { received: true };
};

const paymentHistory = async (userId: string) => {
    const payments = await prisma.payment.findMany({
        where: { tenantId: userId },
        orderBy: { createdAt: "desc" }
    });
    return payments
}

const singlePaymentHistory = async (paymentId: string, userId: string) => {
    
    const payment = await prisma.payment.findUnique({
        where: { 
            id: paymentId,
            tenantId: userId
         },
        include: {
            rentalRequest : {
                include: {
                    property: true
                }
            }
         }
    });
    return payment
}

export const paymentService = {
    createPayment,
    confirmPayment,
    paymentHistory,
    singlePaymentHistory
}