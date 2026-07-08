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

export const rentalRequestController = {
    createRentalRequest
}