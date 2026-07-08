import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { landlordService } from "./landlord.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createProperties = catchAsync(async(req:Request, res:Response) =>{
    const landlordId = req.user?.id
    const payload = req.body;
    const property = await landlordService.createProperties(payload, landlordId as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "property created successfully",
        data: {property}
    })
})

const updateProperties = catchAsync(async(req:Request, res:Response) =>{
    const landlordId = req.user?.id
    const propertiesId = req.params.id
    const payload = req.body;
    const property = await landlordService.updateProperties(payload, propertiesId as string, landlordId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "property updated successfully",
        data: {property}
    })
})

const deleteProperty = catchAsync(async(req:Request, res:Response) =>{
    const landlordId = req.user?.id
    const propertiesId = req.params.id
    await landlordService.deleteProperty(propertiesId as string, landlordId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "property deleted successfully",
        data: null
    })
})

const landlordRentalRequests = catchAsync(async(req:Request, res:Response) => {
    const landlordId = req.user?.id
    const rentalRequests = await landlordService.landlordRentalRequests(landlordId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "rental requests retrieved successfully",
        data: {rentalRequests}
    })
})

export const landlordController = {
    createProperties,
    updateProperties,
    deleteProperty,
    landlordRentalRequests
}