import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Role } from "../../generated/prisma/enums";
import { AppError } from "../utils/AppError";
import httpStatus from "http-status";

declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                name: string;
                phone: string;
                email: string;
                role: string;
            }
        }
    }
}
export const auth = (...requiredRole: Role[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const token = req.cookies.accessToken ?
            req.cookies.accessToken
            :
            req.headers.authorization?.startsWith("Bearer") ?
                req.headers.authorization?.split(" ")[1]
                :
                req.headers.authorization;

        if (!token) {
            throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in");
        }

        const verifyToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

        if (!verifyToken.success) {
            throw new AppError(httpStatus.UNAUTHORIZED, verifyToken.error);
        }
        const { id, role } = verifyToken.data as JwtPayload;

        if (requiredRole.length && !requiredRole.includes(role)) {
            throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to access this route");
        }

        const user = await prisma.user.findUniqueOrThrow({
            where: {
                id
            }
        });
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "user not found");
        }
        if (user.status === "BANNED") {
            throw new AppError(httpStatus.FORBIDDEN, "Your account is banned, please contact support");
        }

        req.user = {
            id: user.id,
            name: user.name,
            phone: user?.phone ?? "",
            email: user.email,
            role: user.role
        }
        next();
    }
    )
};
