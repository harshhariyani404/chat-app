export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const handleControllerError = (res, error, fallbackMessage) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : fallbackMessage;

  return res.status(statusCode).json({
    message,
    ...(error instanceof ApiError && error.details ? { details: error.details } : {}),
  });
};

export const sanitizeUser = (user) => {
  if (!user) return null;

  const source = typeof user.toObject === "function" ? user.toObject() : user;
  const { password, __v, ...safeUser } = source;

  return safeUser;
};
