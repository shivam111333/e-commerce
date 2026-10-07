const validate = (schema, source = "body") => async (req, res, next) => {
  try {
    req[source] = await schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });
    next();
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: err.errors.join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export default validate;