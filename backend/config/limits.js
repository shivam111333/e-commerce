// Read lazily so it works regardless of when dotenv loads
export const getMaxOrderAmount = () => {
  const value = Number(process.env.LIMIT_RAZORPAY_LIMIT);
  return Number.isFinite(value) && value > 0 ? value : 500000;
};

export const formatInr = (amount) => `₹${amount.toLocaleString("en-IN")}`;