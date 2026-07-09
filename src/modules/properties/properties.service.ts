import { prisma } from "../../lib/prisma";
import { IPropertyFilters } from "./properties.interface";


const allProperties = async (filters: IPropertyFilters) => {
    const {
        location,
        minPrice,
        maxPrice,
        propertyType,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10
    } = filters;

    const where = {
        ...(location && {
            location: {
                contains: location,
                mode: "insensitive" as const
            }
        }),
        ...(propertyType && { propertyType }),
        ...(status && { status }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
            price: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice })
            }
        })
    };

    const skip = (page - 1) * limit;

    const [result, total] = await prisma.$transaction([
        prisma.property.findMany({
            where,
            include: {
                rentalRequests: true,
                reviews: true
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        }),
        prisma.property.count({ where })
    ]);

    return {
        properties: result,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
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