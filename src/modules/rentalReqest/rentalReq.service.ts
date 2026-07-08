import { prisma } from "../../lib/prisma";
import { ICreateRentalRequest } from "./rentalReq.interface";

const createRentalRequest = async (payload: ICreateRentalRequest, tenantId: string) => {
    const property = await prisma.property.findUnique({
        where: { id: payload.propertyId },
    });

    if (!property) {
        throw new Error("property not found");
    }

    if (property.status !== "AVAILABLE") {
        throw new Error("this property is not currently available");
    }

    const existingPending = await prisma.rentalRequest.findFirst({
        where: {
            tenantId,
            propertyId: payload.propertyId,
            status: "PENDING",
        },
    });

    if (existingPending) {
        throw new Error("you already have a pending request for this property");
    }

    const rentalRequest = await prisma.rentalRequest.create({
        data: {
            ...payload,
            tenantId,
        },
    });

    return rentalRequest;
};


export const rentalRequestService = {
    createRentalRequest,
};