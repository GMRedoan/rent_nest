import { prisma } from "../../lib/prisma";
import { ICreateReview } from "./review.interface";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const createReview = async (payload: ICreateReview, tenant: string[]) => {
    const tenantId = tenant[0];

    if (!tenantId) {
        throw new AppError(httpStatus.BAD_REQUEST, "invalid tenant information");
    }

    const property = await prisma.property.findUnique({
        where: { id: payload.propertyId },
    });

    if (!property) {
        throw new AppError(httpStatus.NOT_FOUND, "property not found");
    }

    const completedRental = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
            status: "APPROVED",
        },
    });

    if (!completedRental) {
        throw new AppError(httpStatus.BAD_REQUEST, "you can only review properties you have rented");
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