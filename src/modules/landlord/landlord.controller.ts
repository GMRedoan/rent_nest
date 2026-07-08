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

export const landlordController = {
    createProperties
}