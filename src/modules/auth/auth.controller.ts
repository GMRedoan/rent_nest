import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const postUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = await authService.postUserIntoDB(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "user created successfully",
        data: {user}
    })
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const {accessToken, refreshToken} = await authService.loginUser(payload);
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7
    })
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "user logged in successfully",
        data: {accessToken, refreshToken}
    })
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const profile = await authService.getMyProfile(req.user.id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "user retrieved successfully",
        data: {profile}
    })
})


export const authController = {
    postUser,
    loginUser,
    getMe
}