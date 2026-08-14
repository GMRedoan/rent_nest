import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const postUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    await authService.postUserIntoDB(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Verification code has been sent to your email",
        data: null
    })
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await authService.verifyEmail(payload);
    const {accessToken, refreshToken} = result;

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
        message: "user verified successfully",
        data: {accessToken, refreshToken}
    })
})

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
    const userId = req.user?.id
    const profile = await authService.getMyProfile(userId as string);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "user retrieved successfully",
        data: {profile}
    })
})

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const userId = req.params?.id;
    const user = await authService.updateUser(payload, userId as string);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "user updated successfully",
        data: {user}
    })
})

const googleLogin = catchAsync (async (req: Request, res: Response) => {
    const payload = req.body;
    const user = await authService.googleLogin(payload);

    const {accessToken, refreshToken} =  user;

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
        success: true,
        statusCode: httpStatus.OK,
        message: "user logged in successfully",
        data: {accessToken, refreshToken}
    })
})

const forgotPassword = catchAsync (async (req: Request, res: Response) => {
    const payload = req.body;
    await authService.forgotPassword(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `A verification code has been sent to ${payload.email}`,
        data: null
    })
})

const resetPassword = catchAsync (async (req: Request, res: Response) => {
    const payload = req.body;
    await authService.resetPassword(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "password reset successfully",
        data: null
    })
})

export const authController = {
    postUser,
    verifyEmail,
    loginUser,
    getMe,
    updateUser,
    googleLogin,
    forgotPassword,
    resetPassword
}