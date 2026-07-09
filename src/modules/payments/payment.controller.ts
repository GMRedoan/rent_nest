import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import httpStatus from "http-status";

const createPayment = catchAsync(async(req:Request, res:Response) => {
    const payment = await paymentService.createPayment();
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "payment created successfully",
        data: {payment}
    })
})

export const paymentController = {
    createPayment
}