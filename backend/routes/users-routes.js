const express = require("express");

const { body } = require("express-validator");

const userController = require("../controllers/user-controllers");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();

router.get("/", userController.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    body("name").not().isEmpty(),
    body("email").normalizeEmail().isEmail(),
    body("password").isLength({ min: 3 }),
  ],
  userController.postSignUp
);

router.post("/login", userController.postLogin);

module.exports = router;
