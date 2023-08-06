const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// dotenv.config();

exports.connect = async () => {
  mongoose
    .connect(process.env.DB, {
      useUnifiedTopology: true,
    })
    .then(() => console.log("DB Connected Successfully"))
    .catch((err) => console.error("DB connection error: ", err.message));
};
