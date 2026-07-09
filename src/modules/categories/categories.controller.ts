import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoriesService } from "./categories.service";
import httpStatus from "http-status";

const allCategories = catchAsync(async(req:Request, res:Response) => {
    const categories = await categoriesService.allCategories();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "categories retrieved successfully",
        data: {categories}
    })
})

export const categoriesController = {
    allCategories
}