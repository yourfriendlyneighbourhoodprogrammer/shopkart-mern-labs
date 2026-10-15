export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id))
    throw new ApiError(400, "Invalid product or order ID");
}
export function requiredText(value, label, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ApiError(
      400,
      `${label} is required and must be at most ${max} characters`,
    );
  }
  return value.trim();
}
