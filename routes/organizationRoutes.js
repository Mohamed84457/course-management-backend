import express from "express";
// controllers
import {
  createOrganization,
  updateOrganization,
  getAllOrganization,
  getAllActiveOrganization,
  specifiedOrganization,
  ownerSpecifiedOrganization,
  deleteOrganization,
  AllStudentsOfOrganization,
  joinOrganization,
  uploadOrganizationImage
  ,deleteOrganizationImage
} from "../controllers/organizationController.js";
// middlewares
import { validationMiddleware } from "../middlewares/validation.js";
import protectedRoute from "../middlewares/protected.js";
import auth from "../middlewares/auth.js";
import { imageUpload } from "../middlewares/imageUpload.js";
// schema
import { organizationSchema } from "../validations/organization.schema.js";
const organizationRouter = express.Router();

// protected routes

// create organization
organizationRouter.post(
  "/",
  auth,
  protectedRoute,
  validationMiddleware(organizationSchema),
  createOrganization,
);

// update organization
organizationRouter.patch(
  "/:organizationId",
  auth,
  protectedRoute,
  updateOrganization,
);
// get all organization
organizationRouter.get("/all", auth, protectedRoute, getAllOrganization);
// get specified organization
organizationRouter.get(
  "/owner/:organizationId",
  auth,
  protectedRoute,
  ownerSpecifiedOrganization,
);
// delete  organization
organizationRouter.delete(
  "/:organizationId",
  auth,
  protectedRoute,
  deleteOrganization,
);

// get all students of organization
organizationRouter.get(
  "/:organizationId/students",
  auth,
  protectedRoute,
  AllStudentsOfOrganization,
);

// add organization image
organizationRouter.post(
  "/logo/:organizationId",
  auth,
  protectedRoute,
  imageUpload.single("image"),
  uploadOrganizationImage
);
// delet organization image
organizationRouter.delete(
  "/logo/:organizationId",
  auth,
  protectedRoute,
  deleteOrganizationImage
);

// public routes
// get all active organization
organizationRouter.get("/", getAllActiveOrganization);
// get specified organization "but active"
organizationRouter.get("/:organizationId", specifiedOrganization);
// join organization
organizationRouter.post("/join", auth, joinOrganization);

export default organizationRouter;
