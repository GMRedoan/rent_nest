import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/users", auth(Role.ADMIN), adminController.allUsers);

router.patch("/users/:id", auth(Role.ADMIN), adminController.updateUserStatus);

router.get("/properties", auth(Role.ADMIN), adminController.allProperties);

router.get("/rentals", auth(Role.ADMIN), adminController.allRentalRequests);

router.post("/categories", auth(Role.ADMIN), adminController.createCategory);

router.get("/categories", auth(Role.ADMIN), adminController.allCategories);

router.patch("/category/:id", auth(Role.ADMIN), adminController.updateCategory);

router.delete("/category/:id", auth(Role.ADMIN), adminController.deleteCategory);

export const adminRouter = router;