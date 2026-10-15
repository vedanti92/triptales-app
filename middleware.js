const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

const isValidObjectId = (id) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to access this feature!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!res.locals.currUser) {
      return res.redirect("/login");
    }

    if (!isValidObjectId(id)) {
      throw new ExpressError(404, "Listing not found!");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      throw new ExpressError(404, "Listing not found!");
    }

    if (!listing.owner || !listing.owner.equals(res.locals.currUser._id)) {
      req.flash("error", "You don't have permission to access this feature!");
      return res.redirect(`/listings/${id}`);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    if (!res.locals.currUser) {
      return res.redirect("/login");
    }

    if (!isValidObjectId(id) || !isValidObjectId(reviewId)) {
      throw new ExpressError(404, "Review or listing not found!");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      throw new ExpressError(404, "Listing not found!");
    }

    const review = await Review.findById(reviewId);

    if (
      !review ||
      !listing.reviews.some((reviewRef) => reviewRef.equals(review._id))
    ) {
      throw new ExpressError(404, "Review not found!");
    }

    if (!review.author || !review.author.equals(res.locals.currUser._id)) {
      req.flash("error", "You are not the author of this review!");
      return res.redirect(`/listings/${id}`);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    return next(new ExpressError(400, errMsg));
  }

  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    return next(new ExpressError(400, errMsg));
  }

  next();
};
