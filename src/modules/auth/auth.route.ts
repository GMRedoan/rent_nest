import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", authController.postUser);

router.post("/login", authController.loginUser);

router.get("/me", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), authController.getMe);

router.patch("/:id", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), authController.updateUser)

export const authRouter = router;