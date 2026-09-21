import express from "express";
// middlewares
import auth from "../middlewares/auth.js";
import { imageUpload } from "../middlewares/imageUpload.js";
import protectedRoute from "../middlewares/protected.js";
import { validationMiddleware } from "../middlewares/validation.js";
// schema
import categoryScema from "../validations/category.schema.js";
// controllers
import {
  newCategory,
  updateCategory,
  deleteCategory,
  deleteImage,
  getCategories,
  getCategory
} from "../controllers/categoryController.js";

const categoryRoute = express.Router();

// make category(protected)
categoryRoute.post(
  "/",
  auth,
  protectedRoute,
  imageUpload.single("image"),
  validationMiddleware(categoryScema),
  newCategory,
);

// update category
categoryRoute.patch(
  "/:categoryId",
  auth,
  protectedRoute,
  imageUpload.single("image"),
  updateCategory,
);
// get categories
categoryRoute.get("/", auth, protectedRoute, getCategories);
// get category
categoryRoute.get("/:categoryId", auth, protectedRoute, getCategory);
// delete category
categoryRoute.delete("/:categoryId", auth, protectedRoute, deleteCategory);
// delete image
categoryRoute.delete("/:categoryId/image", auth, protectedRoute, deleteImage);

export default categoryRoute;
