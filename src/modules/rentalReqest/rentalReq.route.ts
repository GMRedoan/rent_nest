import { Router } from "express";
import { rentalRequestController } from "./rentalReq.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.TENANT), rentalRequestController.createRentalRequest);

router.get("/", auth(Role.TENANT), rentalRequestController.myRentalRequests);

export const rentalRequestRouter = router;