// Keep VITE_MAX_ORDER_AMOUNT aligned with backend LIMIT_RAZORPAY_LIMIT.
const configuredMaxOrderAmount = Number(import.meta.env.VITE_MAX_ORDER_AMOUNT);

export const MAX_ORDER_AMOUNT =
  Number.isFinite(configuredMaxOrderAmount) && configuredMaxOrderAmount > 0
    ? configuredMaxOrderAmount
    : 500000;

export const MAX_PRICE = MAX_ORDER_AMOUNT;
export const MAX_QTY_PER_ITEM = 10;
export const MAX_STOCK = 100000;
export const MAX_ATTRIBUTES = 10;
export const MAX_ATTRIBUTE_KEY_LENGTH = 30;
export const MAX_ATTRIBUTE_VALUE_LENGTH = 50;
export const MAX_VARIANT_IMAGES = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_VARIANT_IMAGE_TYPES = ["image/jpeg", "image/png"];
