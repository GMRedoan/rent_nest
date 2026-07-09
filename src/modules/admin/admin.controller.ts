import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";
import httpStatus from "http-status";

const allUsers = catchAsync(async(req:Request, res:Response) => {
    const users = await adminService.allUsers();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "users retrieved successfully",
        data: {users}
    })
})

const updateUserStatus = catchAsync(async(req:Request, res:Response) => {
    const userId = req.params.id
    const status = req.body.status
    const user = await adminService.updateUserStatus(userId as string, status);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "user status updated successfully",
        data: {user}
    })
})

const allProperties = catchAsync(async(req:Request, res:Response) => {
    const properties = await adminService.allProperties();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "properties retrieved successfully",
        data: {properties}
    })
})

const allRentalRequests = catchAsync(async(req:Request, res:Response) => {
    const rentalRequests = await adminService.allRentalRequests();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "rental requests retrieved successfully",
        data: {rentalRequests}
    })
})

const createCategory = catchAsync(async(req:Request, res:Response) => {
    const payload = req.body
    const category = await adminService.createCategory(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "category created successfully",
        data: {category}
    })
})

const allCategories = catchAsync(async(req:Request, res:Response) => {
    const categories = await adminService.allCategories();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "categories retrieved successfully",
        data: {categories}
    })
})

const updateCategory = catchAsync(async(req:Request, res:Response) => {
    const categoryId = req.params.id
    const payload = req.body
    const category = await adminService.updateCategory(categoryId as string, payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "category updated successfully",
        data: {category}
    })
})

const deleteCategory = catchAsync(async(req:Request, res:Response) => {
    const categoryId = req.params.id
    await adminService.deleteCategory(categoryId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "category deleted successfully",
        data: null
    })
})

export const adminController = {
    allUsers,
    updateUserStatus,
    allProperties,
    allRentalRequests,
    createCategory,
    allCategories,
    updateCategory,
    deleteCategory
}