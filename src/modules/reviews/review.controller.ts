import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reviewService } from "./review.service";
import httpStatus from "http-status";

const createReview = catchAsync(async(req:Request, res:Response) => {
    const payload = req.body;
    const tenant = req.user
    const review = await reviewService.createReview(payload, [tenant.id]);
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