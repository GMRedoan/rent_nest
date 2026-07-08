import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { propertiesService } from "./properties.service";
import { sendResponse } from "../../utils/sendResponse";

const allProperties = catchAsync(async(req:Request, res:Response) => {
    const properties = await propertiesService.allProperties();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "properties retrieved successfully",
        data: {properties}
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