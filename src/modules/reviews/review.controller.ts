import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";
import httpStatus from "http-status";

const createReview = catchAsync(async(req:Request, res:Response) => {
    const payload = req.body;
    const tenantId = req.user?.id
    const review = await reviewService.createReview(payload, tenantId);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "review created successfully",
        data: {review}
    })
})

export const reviewController = {
    createReview
}