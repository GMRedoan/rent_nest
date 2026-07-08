import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { rentalRequestService } from "./rentalReq.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createRentalRequest = catchAsync(async(req:Request, res:Response) => {
    const payload = req.body
    const tenantId = req.user?.id
    const rentalRequest = await rentalRequestService.createRentalRequest(payload, tenantId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "rental request submitted successfully",
        data: {rentalRequest}
    })
})

const myRentalRequests = catchAsync(async(req:Request, res:Response) => {
    const tenantId = req.user?.id
    const rentalRequests = await rentalRequestService.myRentalRequests(tenantId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "rental requests retrieved successfully",
        data: {rentalRequests}
    })
})

 
export const rentalRequestController = {
    createRentalRequest,
    myRentalRequests
}