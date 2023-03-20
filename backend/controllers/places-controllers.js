const fs = require("fs");
const { v4: uuid } = require("uuid");
const mongoose = require("mongoose");

const { validationResult } = require("express-validator");
const getCoordinates = require("../utils/get-geoLocation");
const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");

exports.getPlacesById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("unable to get a place", 500);
    return next(error);
  }

  if (!place) {
    throw new HttpError("could not find a place", 404);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  //   const places = DUMMY_PLACES.filter((p) => p.creator === userId);
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("unable to connect to database", 500);
    return next(error);
  }

  // if (places.length === 0) {
  //   return next(new HttpError("could not find a user requested places", 404));
  // }

  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

exports.updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors || !errors.isEmpty()) {
    throw new HttpError("invalid input", 422);
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;
  //   const index = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  //   if (index === -1) {
  //     throw new HttpError("place does not exits", 404);
  //   }
  //   DUMMY_PLACES[index] = { ...DUMMY_PLACES[index], ...req.body };
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("could not fetch the place", 500);
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("not authorized to edit this place"), 401);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("could not save the place", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

exports.deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  //   DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== req.params.pid);
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    console.log(err);
    return next(new HttpError("unable to delete a place", 500));
  }

  if (!place) {
    return next(new HttpError("unable to find a place by given id", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError("not authorized to edit this place"), 401);
  }

  const imagePath = place.imageUrl;

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(new HttpError("unable to delete a place by given id", 500));
  }

  res.status(200).json({ message: "deleted a place succesfully" });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors || !errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("invalid input", 422));
  }
  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordinates(address);
  } catch (error) {
    return next(error);
  }
  const newPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    creator,
    imageUrl: req.file.path,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "could not find the user with corresponding id",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "could not find the user with corresponding id",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPlace.save({ session: sess });
    user.places.push(newPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("unable to update please try again later", 500);
    return next(error);
  }
  res.status(201).json({
    place: newPlace.toObject({ getters: true }),
  });
};
