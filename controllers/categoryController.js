// models
import { categoryModel } from "../models/Category.model.js";
import { courseModel } from "../models/Course.model.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// create category
const newCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { organizationId } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "category image is required",
      });
    }

    const result = await categoryModel.create({
      name,
      description,
      image: `/uploads/${req.file.filename}`,
      organizationId: organizationId,
    });

    res.status(201).json({
      success: true,
      message: "category created successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// update category

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const organizationId = req.user.organizationId;

    // Find category belonging to current organization
    const category = await categoryModel.findOne({
      _id: categoryId,
      organizationId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    // Fields that are allowed to be updated
    const updateAbleFields = ["name", "description"];

    const newCategoryData = {};

    for (const key of updateAbleFields) {
      if (req.body?.[key] !== undefined) {
        newCategoryData[key] = req.body[key];
      }
    }

    // Check duplicate category name only if name is being updated
    if (newCategoryData.name !== undefined) {
      const exist = await categoryModel.findOne({
        name: newCategoryData.name,
        organizationId,
        _id: { $ne: category._id },
      });

      if (exist) {
        return res.status(400).json({
          success: false,
          message: "category name already exists",
        });
      }
    }

    // Check if there is anything to update
    if (Object.keys(newCategoryData).length === 0 && !req.file) {
      return res.status(400).json({
        success: false,
        message: "nothing to update",
      });
    }

    // Update text fields
    Object.assign(category, newCategoryData);

    // Update image if a new image was uploaded
    if (req.file) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      if (category.image) {
        // Example:
        // category.image = "/uploads/123-image.jpg"

        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          category.image,
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      category.image = `/uploads/${req.file.filename}`;
    }

    // Save changes
    await category.save();

    return res.status(200).json({
      success: true,
      message: "category updated successfully",
      category,
    });
  } catch (err) {
    console.error("updateCategory error:", err);

    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get categories
const getCategories = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const categories = await categoryModel.find({
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "categories fetched successfully",
      categories,
    });
  } catch (err) {
    console.error("getCategories error:", err);

    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};
// get category
const getCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { organizationId } = req.user;

    const category = await categoryModel.findOne({
      _id: categoryId,
      organizationId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "category fetched successfully",
      category,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { organizationId } = req.user;

    const category = await categoryModel.findOne({
      _id: categoryId,
      organizationId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (category.image) {
      const oldImagePath = path.join(__dirname, "..", "public", category.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    await category.deleteOne();
    await courseModel.deleteMany({
      categoryId,
    });

    res.status(200).json({
      success: true,
      message: "category deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete image
const deleteImage = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { organizationId } = req.user;

    const category = await categoryModel.findOne({
      _id: categoryId,
      organizationId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "category not found",
      });
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (category.image) {
      const oldImagePath = path.join(__dirname, "..", "public", category.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    category.image = null;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "image deleted successfully",
      category,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export {
  newCategory,
  updateCategory,
  deleteCategory,
  deleteImage,
  getCategories,
  getCategory,
};
