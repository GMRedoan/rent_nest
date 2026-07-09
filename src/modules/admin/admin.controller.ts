import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";

const allUsers = catchAsync(async(req:Request, res:Response) => {
    const users = await adminService.allUsers();
    sendResponse(res, {
        statusCode: 200,
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
        statusCode: 200,
        success: true,
        message: "user status updated successfully",
        data: {user}
    })
})

const allProperties = catchAsync(async(req:Request, res:Response) => {
    const properties = await adminService.allProperties();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "properties retrieved successfully",
        data: {properties}
    })
})

const allRentalRequests = catchAsync(async(req:Request, res:Response) => {
    const rentalRequests = await adminService.allRentalRequests();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "rental requests retrieved successfully",
        data: {rentalRequests}
    })
})

const createCategory = catchAsync(async(req:Request, res:Response) => {
    const payload = req.body
    const category = await adminService.createCategory(payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "category created successfully",
        data: {category}
    })
})

export const adminController = {
    allUsers,
    updateUserStatus,
    allProperties,
    allRentalRequests,
    createCategory
}