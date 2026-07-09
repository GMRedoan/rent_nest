import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const createPayment = catchAsync(async(req:Request, res:Response) => {
    const { rentalRequestId } = req.body;
    const tenantId = req.user?.id;
    const payment = await paymentService.createPayment(rentalRequestId, tenantId as string);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "payment created successfully",
        data: {payment}
    })
})

const confirmPayment = catchAsync(async(req:Request, res:Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const rawBody = req.body;
    const result = await paymentService.confirmPayment(rawBody, signature);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "payment confirmed successfully",
        data: {result}
    })
})

const paymentHistory = catchAsync(async(req:Request, res:Response) => {
    const tenantId = req.user?.id;
    const payments = await paymentService.paymentHistory(tenantId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "payment history retrieved successfully",
        data: {payments}
    })
});
 
const singlePaymentHistory = catchAsync(async(req:Request, res:Response) => {
    const paymentId = req.params.id;
    const tenantId = req.user?.id;
    const payment = await paymentService.singlePaymentHistory(paymentId as string, tenantId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "payment history retrieved successfully",
        data: {payment}
    })
});

export const paymentController = {
    createPayment,
    confirmPayment,
    paymentHistory,
    singlePaymentHistory
}