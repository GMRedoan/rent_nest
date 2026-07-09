import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { propertiesService } from "./properties.service";
import { sendResponse } from "../../utils/sendResponse";
import { PropertyStatus, PropertyType } from "../../../generated/prisma/enums";

const allProperties = catchAsync(async(req:Request, res:Response) => {
    const {
        location,
        minPrice,
        maxPrice,
        propertyType,
        status,
        sortBy,
        sortOrder,
        page,
        limit
    } = req.query;
    const properties = await propertiesService.allProperties({
        location: location as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        propertyType: propertyType as PropertyType,
        status: status as PropertyStatus,
        sortBy: sortBy as "price" | "createdAt" | "title",
        sortOrder: sortOrder as "asc" | "desc",
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
    });
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "properties retrieved successfully",
        data: properties
    })
})

const singleProperty = catchAsync(async(req:Request, res:Response) => {
    const propertyId = req.params.id
    const properties = await propertiesService.singleProperty(propertyId as string);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "properties retrieved successfully",
        data: {properties}
    })
})

export const propertiesController = {
    allProperties,
    singleProperty
}