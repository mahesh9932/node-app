const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error();
    }
    let decodedData = jwt.verify(token, process.env.SECRET_KEY);
    req.userData = { userId: decodedData.userId, email: decodedData.email };
    return next();
  } catch (err) {
    console.log(err);
    return next(new HttpError("Authorization failerd", 401));
  }
};
