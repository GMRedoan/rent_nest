import { Response } from "express";

type TResponse<T> = {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    meta?: {
        page: number;
        limit: number;
        total?: number;
        totalPage: number;
    }
}

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
    res.status(data.statusCode).json({
        success: data.success,
        statusCode: data.statusCode,
        message: data.message,
        data: data.data,
        meta: data.meta
    });
}
