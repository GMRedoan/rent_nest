import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
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

const app: Application = express();
app.use(cors({
    origin: "http://localhost:3000",
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
    res.send("Hello World!");
});

app.use("/api/auth", authRouter);
app.use("/api/landlord", landlordRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/rentals", rentalRequestRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/payments", paymentsRouter);

app.use(globalError);
app.use(notFound);

export default app;