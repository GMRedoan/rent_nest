import { Router } from "express";
import { categoriesController } from "./categories.controller";

const router = Router();

router.get("/", categoriesController.allCategories);

export const categoriesRouter = router;