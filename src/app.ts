import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";

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

export default app;