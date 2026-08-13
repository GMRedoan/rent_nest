import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import { UserValidation } from "./auth.validation";

const router = Router();

router.post("/register",
     validateRequest(UserValidation.createUserValidationSchema),
     authController.postUser);
router.post("/login", authController.loginUser);
router.get("/me", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), authController.getMe);
router.patch("/:id", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), authController.updateUser)
router.post("/google", authController.googleLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password",
     validateRequest(UserValidation.resetPasswordSchema), 
     authController.resetPassword);

export const authRouter = router;