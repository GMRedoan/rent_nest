import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/users", auth(Role.ADMIN), adminController.allUsers);
router.patch("/users/:id", auth(Role.ADMIN), adminController.updateUserStatus);
router.get("/properties", auth(Role.ADMIN), adminController.allProperties);


export const adminRouter = router;