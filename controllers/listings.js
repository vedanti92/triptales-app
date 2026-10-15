const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const ExpressError = require("../utils/ExpressError.js");
const mongoose = require("mongoose");

module.exports.index = async (req, res) => {
  const requestedPage = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 9;

  const totalListings = await Listing.countDocuments({});
  const totalPages = Math.ceil(totalListings / limit);

  // Redirect requests beyond the last page.
  if (totalPages > 0 && requestedPage > totalPages) {
    return res.redirect(`/listings?page=${totalPages}`);
  }

  const currentPage = requestedPage;
  const skip = (currentPage - 1) * limit;

  const allListings = await Listing.find({}).skip(skip).limit(limit);

  res.render("listings/index.ejs", {
    allListings,
    currentPage,
    totalPages,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError(400, "Invalid ID!");
  }

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response;
  try {
    response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();
  } catch (err) {
    throw new ExpressError(500, "Geocoding service failed!");
  }

  if (!req.file) {
    throw new ExpressError(400, "Image is required!");
  }
  let url = req.file.path;
  let filename = req.file.filename;
  const category = req.body.listing.category;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.category = category;

  if (!response.body.features.length) {
    throw new ExpressError(400, "Invalid location!");
  }
  newListing.geometry = response.body.features[0].geometry;

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError(400, "Invalid ID!");
  }

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError(400, "Invalid ID!");
  }

  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true },
  );

  if (!listing) {
    throw new ExpressError(404, "Listing not found!");
  }

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError(400, "Invalid ID!");
  }

  const listing = await Listing.findByIdAndDelete(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found!");
  }

  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
