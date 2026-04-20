const reviewController = require("../../controllers/reviews");
const Listing = require("../../models/listing");
const Review = require("../../models/review");
const mongoose = require("mongoose");

// ✅ Mock models
jest.mock("../../models/listing");
jest.mock("../../models/review");

// ─── Helpers ───────────────────────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  flash: jest.fn(),
  user: { _id: new mongoose.Types.ObjectId() },
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// ─── createReview ──────────────────────────────────────────────────────────────

describe("reviewController.createReview", () => {
  it("should create a review and redirect", async () => {
    const listingId = new mongoose.Types.ObjectId();
    const req = mockReq({
      params: { id: listingId.toString() },
      body: { review: { comment: "Amazing place!", rating: 5 } },
    });
    const res = mockRes();

    const fakeListing = {
      _id: listingId,
      reviews: [],
      save: jest.fn(),
    };

    const fakeReview = {
      _id: new mongoose.Types.ObjectId(),
      comment: "Amazing place!",
      rating: 5,
      save: jest.fn(),
    };

    Listing.findById.mockResolvedValue(fakeListing);

    // Mock Review constructor
    Review.mockImplementation(() => fakeReview);

    await reviewController.createReview(req, res);

    expect(fakeReview.save).toHaveBeenCalled();
    expect(fakeListing.save).toHaveBeenCalled();
    expect(fakeListing.reviews).toContain(fakeReview);
    expect(req.flash).toHaveBeenCalledWith("success", "New Review Created!");
    expect(res.redirect).toHaveBeenCalledWith(`/listings/${listingId}`);
  });
});

// ─── destroyReview ─────────────────────────────────────────────────────────────

describe("reviewController.destroyReview", () => {
  it("should delete review and redirect", async () => {
    const listingId = new mongoose.Types.ObjectId().toString();
    const reviewId = new mongoose.Types.ObjectId().toString();

    const req = mockReq({
      params: { id: listingId, reviewId },
    });
    const res = mockRes();

    Listing.findByIdAndUpdate.mockResolvedValue({});
    Review.findByIdAndDelete.mockResolvedValue({});

    await reviewController.destroyReview(req, res);

    expect(Listing.findByIdAndUpdate).toHaveBeenCalledWith(listingId, {
      $pull: { reviews: reviewId },
    });
    expect(Review.findByIdAndDelete).toHaveBeenCalledWith(reviewId);
    expect(req.flash).toHaveBeenCalledWith("success", "Review Deleted!");
    expect(res.redirect).toHaveBeenCalledWith(`/listings/${listingId}`);
  });
});
