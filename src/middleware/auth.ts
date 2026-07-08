import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Role } from "../../generated/prisma/enums";

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
            throw new Error("You are not logged in");
        }

        const verifyToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

        if (!verifyToken.success) {
            throw new Error(verifyToken.error);
        }
        const { id, name, phone, email, role } = verifyToken.data as JwtPayload;

        if (requiredRole.length && !requiredRole.includes(role)) {
            throw new Error("You are not allowed to access this route");
        }

        const user = await prisma.user.findUniqueOrThrow({
            where: {
                id,
                name,
                phone,
                email,
                role
            }
        });
        if (!user) {
            throw new Error("user not found");
        }
        if (user.status === "BANNED") {
            throw new Error("Your account is banned, please contact support");
        }

        req.user = {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role
        }
        next();
    }
    )
};
