const fs = require("fs");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  res.setHeader("Access-Control-Allow-Methods", "*");

  next();
});

app.use("/uploads/images", express.static("uploads/images"));

app.use("/api/places", placesRoutes);
app.use("/api/users", userRoutes);
app.use((req, res, next) => {
  throw new HttpError("specified routenot found", 404);
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || "some error ocuured",
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.7vdabfk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen();
  })
  .catch((err) => {
    console.log(err);
  });
