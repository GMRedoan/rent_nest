import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.route";
import { globalError } from "./middleware/globalError";
import { landlordRouter } from "./modules/landlord/landlord.route";
import { propertiesRouter } from "./modules/properties/properties.route";
import { adminRouter } from "./modules/admin/admin.route";

const app: Application = express();
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))

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

app.use(globalError);

export default app;