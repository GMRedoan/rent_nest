import { Router } from "express";
import { landlordController } from "./landlord.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/properties", auth(Role.LANDLORD), landlordController.createProperties);

router.put("/properties/:id", auth(Role.LANDLORD), landlordController.updateProperties);

router.delete("/properties/:id", auth(Role.LANDLORD), landlordController.deleteProperty);

router.get("/requests", auth(Role.LANDLORD), landlordController.landlordRentalRequests);

router.patch("/requests/:id", auth(Role.LANDLORD), landlordController.updateRentalRequest);

export const landlordRouter = router;