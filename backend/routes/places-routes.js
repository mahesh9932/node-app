const express = require("express");
const { body } = require("express-validator");

const placesController = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

const checkAuth = require("../middleware/check-auth");

router.get("/:pid", placesController.getPlacesById);
router.get("/user/:userId", placesController.getPlacesByUserId);

console.log("here");

router.use(checkAuth);

router.patch(
  "/:pid",
  [body("title").not().isEmpty(), body("description").isLength({ min: 5 })],
  placesController.updatePlaceById
);

router.delete("/:pid", placesController.deletePlaceById);

router.post(
  "/",
  fileUpload.single("image"),
  [
    body("title").not().isEmpty(),
    body("description").isLength({ min: 5 }),
    body("address").not().isEmpty(),
  ],
  placesController.createPlace
);

module.exports = router;
