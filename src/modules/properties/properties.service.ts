import { prisma } from "../../lib/prisma";

const allProperties = async() =>{
    const result = await prisma.property.findMany({
        include: {
            rentalRequests: true,
            reviews: true
        }
    });
    return result
}

const singleProperty = async(propertyId: string) => {
    const property = await prisma.property.findUnique({
        where: {
            id: propertyId
        } 
    })
    if (!property) {
        throw new Error("property not found");
    }
    
    const result = await prisma.property.findUnique({
        where: {
            id: propertyId
        },
        include: {
            rentalRequests: true,
            reviews: true
        }
    });
    return result
}

export const propertiesService = {
    allProperties,
    singleProperty
}