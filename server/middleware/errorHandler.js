function errorHandler(err, req, res, next) {
  console.error(err);

  if (
    err.code ===
    "LIMIT_FILE_SIZE"
  ) {
    return res
      .status(400)
      .json({
        message:
          "Image must be 5 MB or smaller",
      });
  }

  if (
    err.message ===
    "Only JPG, PNG, and WEBP images are allowed"
  ) {
    return res
      .status(400)
      .json({
        message:
          err.message,
      });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      message: "Validation failed",
      errors: messages,
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }

  // Duplicate unique field
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0];

    let message = "Duplicate value is not allowed";

    if (duplicateField === "email") {
      message = "This email is already in use";
    }

    if (duplicateField === "applicationCode") {
      message = "Application code already exists";
    }

    if (
      err.keyPattern &&
      err.keyPattern.vendorCall &&
      err.keyPattern.email
    ) {
      message =
        "This email has already submitted an application for this vendor call";
    }

    return res.status(400).json({
      message,
    });
  }

  // Unknown server error
  res.status(500).json({
    message: "Something went wrong",
  });
}

module.exports = errorHandler;