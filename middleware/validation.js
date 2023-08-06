const joi = require("@hapi/joi");

module.exports = {
  validateAddApp: async (req, res, next) => {
    const schema = joi.object().keys({
      name: joi.string().required(),
      description: joi.string().required(),
    });
    await validate(schema, req.query, res, next);
  },
  validateQuery: async (req, res, next) => {
    const schema = joi.object().keys({
      appId: joi.string().required(),
      question: joi.string().required(),
    });
    await validate(schema, req.body, res, next);
  },
};

const validate = async (schema, reqData, res, next) => {
  try {
    await joi.validate(reqData, schema, {
      abortEarly: false,
      allowUnknown: true,
    });
    next();
  } catch (e) {
    const errors = e.details.map(({ path, message, value }) => ({
      path,
      message,
      value,
    }));
    res.status(400).format({
      json: () => {
        res.send({ message: "Invalid request", errors, code: 400 });
      },
    });
  }
};
