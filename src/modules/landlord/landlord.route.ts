import { Router } from "express";
import { landlordController } from "./landlord.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/properties", auth(Role.LANDLORD), landlordController.createProperties);

export const landlordRouter = router;