const express = require("express");
const multer = require("multer");

const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ------------------------------------------------------
// MULTER MEMORY STORAGE
// ------------------------------------------------------
const storage = multer.memoryStorage();

// ------------------------------------------------------
// IMAGE FILTER
// ------------------------------------------------------
function imageFilter(req, file, callback) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
  }

  callback(null, true);
}

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFilter,
});

// ------------------------------------------------------
// HELPER: CLOUDINARY STREAM UPLOAD
// ------------------------------------------------------
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "poppin/events",

        resource_type: "image",
      },

      (error, result) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

// ------------------------------------------------------
// POST IMAGE
// POST /api/uploads/image
// ------------------------------------------------------
router.post(
  "/image",
  require("../middleware/auth").requireAuth,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select an image",
        });
      }

      const result = await uploadToCloudinary(req.file.buffer);

      res.status(201).json({
        message: "Image uploaded successfully",

        secureUrl: result.secure_url,

        publicId: result.public_id,

        width: result.width,

        height: result.height,

        format: result.format,
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
