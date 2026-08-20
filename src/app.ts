import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.route";
import { globalError } from "./middleware/globalError";
import { landlordRouter } from "./modules/landlord/landlord.route";
import { propertiesRouter } from "./modules/properties/properties.route";
import { adminRouter } from "./modules/admin/admin.route";
import { rentalRequestRouter } from "./modules/rentalRequest/rentalReq.route";
import { notFound } from "./middleware/notFound";
import { reviewsRouter } from "./modules/reviews/review.route";
import { categoriesRouter } from "./modules/categories/categories.route";
import { paymentsRouter } from "./modules/payments/payment.route";
import { redisClient } from "./lib/redis";
import { sendResponse } from "./utils/sendResponse";
import crypto from "crypto";
import { getBkashIdToken } from "./lib/bkash";

const app: Application = express();
const allowedOrigins = [
    "http://localhost:3000",
    "https://rent-nest-frontend-navy.vercel.app"
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

app.post(
    "/api/payments/confirm",
    express.raw({ type: "application/json" })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("server is running");
});

app.use("/api/auth", authRouter);
app.use("/api/landlord", landlordRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/rentals", rentalRequestRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/payments", paymentsRouter);

// test
app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grantIdToken = await getBkashIdToken();
        console.log(grantIdToken);

        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: "test",
            data: grantIdToken
        })
    } catch (error) {
         next(error);
    }
});

app.use(globalError);
app.use(notFound);

export default app;