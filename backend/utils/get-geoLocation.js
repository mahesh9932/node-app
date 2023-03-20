const API_KEY = process.env.GOOGLE_API_KEY;
const axios = require("axios");
const HttpError = require("../models/http-error");

const getCoordinates = async (address) => {
  const res = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = res.data;
  console.log(data);
  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError("adress is not valid", 422);
  }
  return data.results[0].geometry.location;
};

module.exports = getCoordinates;
