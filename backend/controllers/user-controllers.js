const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const User = require("../models/user");

exports.getUsers = async (req, res, next) => {
  // res.json({ users: DUMMY_USERS });
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    return next(new HttpError("unable to get users", 500));
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

exports.postSignUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("please enter the valid details", 422));
  }
  const { name, email, password } = req.body;
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("something went wrong"), 500);
  }
  if (hasUser) {
    return next(new HttpError("user already exists"), 422);
  }

  // const hasUser = DUMMY_USERS.find((u) => u.email === email);
  // if (hasUser) {
  //   throw new HttpError("user already exits with email", 422);
  // }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("could not save the user", 500));
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    places: [],
    image: req.file.path,
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError("unable to signup", 500));
  }
  // DUMMY_USERS.push(newUser);

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("unable to signup", 500));
  }

  res.status(201).json({
    userId: newUser.id,
    email: newUser.email,
    token: token,
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  // const user = DUMMY_USERS.find((u) => u.email === email);
  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Logging in failed, something went wrong", 500));
  }

  if (!user) {
    return next(new HttpError("user credentials are not correct", 401));
  }

  let isValid = false;

  try {
    isValid = await bcrypt.compare(password, user.password);
  } catch (err) {
    return next(new HttpError("Logging in failed, something went wrong", 500));
  }

  if (!isValid) {
    return next(new HttpError("Invalid credentials", 401));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("unable to signup", 500));
  }

  res.json({
    userId: user.id,
    email: user.email,
    token: token,
  });
};
