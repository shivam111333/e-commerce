const validate = (schema, source = "body") => async (req, res, next) => {
  try {
    req[source] = await schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    next();
  } catch (err) {
    if (err.name === "ValidationError") {
      // First message per field: { name: "Category name is required", ... }
      const errors = {};
      for (const e of err.inner) {
        if (e.path && !errors[e.path]) errors[e.path] = e.message;
      }

      return res.status(400).json({
        success: false,
        message: err.errors.join(", "), // kept, so existing toasts still work
        errors,
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

export default validate;