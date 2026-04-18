export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const getDuplicateKeyDetails = (error) => {
  const key = Object.keys(error?.keyPattern || error?.keyValue || {})[0];
  const value = key ? error.keyValue?.[key] : undefined;

  if (!key) {
    return null;
  }

  return {
    statusCode: 409,
    message: `${key} already exists`,
    details: value !== undefined ? { field: key, value } : { field: key },
  };
};

const getValidationDetails = (error) => {
  if (error?.name !== "ValidationError" || !error.errors) {
    return null;
  }

  const details = Object.values(error.errors).map((entry) => ({
    field: entry.path,
    message: entry.message,
  }));

  return {
    statusCode: 400,
    message: details[0]?.message || "Validation failed",
    details,
  };
};

export const handleControllerError = (res, error, fallbackMessage) => {
  const duplicateKeyError = error?.code === 11000 ? getDuplicateKeyDetails(error) : null;
  const validationError = getValidationDetails(error);
  const normalizedError =
    error instanceof ApiError
      ? error
      : duplicateKeyError || validationError || null;

  const statusCode =
    normalizedError instanceof ApiError ? normalizedError.statusCode : normalizedError?.statusCode || 500;
  const message =
    normalizedError instanceof ApiError ? normalizedError.message : normalizedError?.message || fallbackMessage;
  const details =
    normalizedError instanceof ApiError ? normalizedError.details : normalizedError?.details;

  if (statusCode >= 500) {
    console.error(`[controller] ${fallbackMessage}`);
    console.error(error);
  }

  return res.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
  });
};

export const sanitizeUser = (user) => {
  if (!user) return null;

  const source = typeof user.toObject === "function" ? user.toObject() : user;
  const { password, __v, ...safeUser } = source;

  return safeUser;
};
