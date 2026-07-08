import { Router } from "express";
import { propertiesController } from "./properties.controller";

const router = Router();

router.get("/", propertiesController.allProperties);
router.get("/:id", propertiesController.singleProperty);

 export const propertiesRouter = router;