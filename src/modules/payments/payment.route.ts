import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/create", auth(Role.TENANT), paymentController.createPayment);

router.post("/confirm", auth(Role.TENANT), paymentController.confirmPayment);

router.get("/", auth(Role.TENANT),paymentController.paymentHistory);

router.get("/:id", auth(Role.TENANT), paymentController.singlePaymentHistory);

export const paymentsRouter = router;