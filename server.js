require('dotenv').config();
const express = require("express");
const route = require("./routes/index");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { connect } = require("./dbConnection");
const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(express.json());
route(app);
app.use("/uploads", express.static(__dirname + "/uploads"));

//db connection
connect();

app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
