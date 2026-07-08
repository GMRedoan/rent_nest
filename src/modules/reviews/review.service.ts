import { prisma } from "../../lib/prisma";
import { ICreateReview } from "./review.interface";

const createReview = async (payload: ICreateReview, tenantId: string) => {
    const property = await prisma.property.findUnique({
        where: { id: payload.propertyId },
    });

    if (!property) {
        throw new Error("property not found");
    }

    const completedRental = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
            status: "APPROVED",
        },
    });

    if (!completedRental) {
        throw new Error("you can only review properties you have rented");
    }

    const review = await prisma.review.create({
        data: {
            ...payload,
            tenantId,
        },
    });

    return review;
}

export const reviewService = {
    createReview
}