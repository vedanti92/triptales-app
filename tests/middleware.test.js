const middlewares = require("../middleware");
const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError");

const listingId = "507f1f77bcf86cd799439011";
const reviewId = "507f1f77bcf86cd799439012";
const userId = "507f1f77bcf86cd799439013";
const otherUserId = "507f1f77bcf86cd799439014";

jest.mock("../models/listing");
jest.mock("../models/review");

const mockReq = (overrides = {}) => ({
  session: {},
  flash: jest.fn(),
  originalUrl: "/listings/new",
  isAuthenticated: jest.fn().mockReturnValue(true),
  params: {},
  body: {},
  ...overrides,
});

const mockRes = (overrides = {}) => ({
  redirect: jest.fn(),
  locals: { redirectUrl: null, currUser: { _id: userId } },
  ...overrides,
});

const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  next.mockReset();
});

// ─── isLoggedIn ────────────────────────────────────────────────────────────────

describe("isLoggedIn", () => {
  it("should call next if user is authenticated", () => {
    const req = mockReq({ isAuthenticated: jest.fn().mockReturnValue(true) });
    const res = mockRes();

    middlewares.isLoggedIn(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should redirect to /login if not authenticated", () => {
    const req = mockReq({ isAuthenticated: jest.fn().mockReturnValue(false) });
    const res = mockRes();

    middlewares.isLoggedIn(req, res, next);

    expect(req.flash).toHaveBeenCalledWith("error", expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("should save redirectUrl in session if not authenticated", () => {
    const req = mockReq({
      isAuthenticated: jest.fn().mockReturnValue(false),
      originalUrl: "/listings/new",
    });
    const res = mockRes();

    middlewares.isLoggedIn(req, res, next);

    expect(req.session.redirectUrl).toBe("/listings/new");
  });
});

// ─── saveRedirectUrl ───────────────────────────────────────────────────────────

describe("saveRedirectUrl", () => {
  it("should save redirectUrl to res.locals if present in session", () => {
    const req = mockReq({ session: { redirectUrl: "/listings/123" } });
    const res = mockRes();

    middlewares.saveRedirectUrl(req, res, next);

    expect(res.locals.redirectUrl).toBe("/listings/123");
    expect(next).toHaveBeenCalled();
  });

  it("should call next even if no redirectUrl in session", () => {
    const req = mockReq({ session: {} });
    const res = mockRes();

    middlewares.saveRedirectUrl(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ─── isOwner ───────────────────────────────────────────────────────────────────

describe("isOwner", () => {
  it("should call next if current user is the owner", async () => {
    const req = mockReq({ params: { id: listingId } });
    const res = mockRes({ locals: { currUser: { _id: userId } } });

    const fakeListing = {
      owner: { equals: jest.fn().mockReturnValue(true) },
    };
    Listing.findById.mockResolvedValue(fakeListing);

    await middlewares.isOwner(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should redirect if current user is not the owner", async () => {
    const req = mockReq({ params: { id: listingId } });
    const res = mockRes({ locals: { currUser: { _id: otherUserId } } });

    const fakeListing = {
      owner: { equals: jest.fn().mockReturnValue(false) },
    };
    Listing.findById.mockResolvedValue(fakeListing);

    await middlewares.isOwner(req, res, next);

    expect(req.flash).toHaveBeenCalledWith("error", expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith(`/listings/${listingId}`);
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass a 404 error for an invalid listing ID", async () => {
    const req = mockReq({ params: { id: "invalid-id" } });
    const res = mockRes();

    await middlewares.isOwner(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
    expect(Listing.findById).not.toHaveBeenCalled();
  });

  it("should pass a 404 error when the listing does not exist", async () => {
    const req = mockReq({ params: { id: listingId } });
    const res = mockRes();

    Listing.findById.mockResolvedValue(null);

    await middlewares.isOwner(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

// ─── isReviewAuthor ────────────────────────────────────────────────────────────

describe("isReviewAuthor", () => {
  it("should call next if current user is the review author", async () => {
    const req = mockReq({
      params: { id: listingId, reviewId },
    });
    const res = mockRes({ locals: { currUser: { _id: userId } } });

    Listing.findById.mockResolvedValue({
      reviews: [{ equals: (id) => id.toString() === reviewId }],
    });

    const fakeReview = {
      _id: reviewId,
      author: { equals: jest.fn().mockReturnValue(true) },
    };
    Review.findById.mockResolvedValue(fakeReview);

    await middlewares.isReviewAuthor(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should redirect if current user is not the review author", async () => {
    const req = mockReq({
      params: { id: listingId, reviewId },
    });
    const res = mockRes({ locals: { currUser: { _id: otherUserId } } });

    Listing.findById.mockResolvedValue({
      reviews: [{ equals: (id) => id.toString() === reviewId }],
    });

    const fakeReview = {
      _id: reviewId,
      author: { equals: jest.fn().mockReturnValue(false) },
    };
    Review.findById.mockResolvedValue(fakeReview);

    await middlewares.isReviewAuthor(req, res, next);

    expect(req.flash).toHaveBeenCalledWith("error", expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith(`/listings/${listingId}`);
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass a 404 error for an invalid review ID", async () => {
    const req = mockReq({
      params: { id: listingId, reviewId: "invalid-id" },
    });
    const res = mockRes();

    await middlewares.isReviewAuthor(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
    expect(Review.findById).not.toHaveBeenCalled();
  });

  it("should pass a 404 error when the listing does not exist", async () => {
    const req = mockReq({
      params: { id: listingId, reviewId },
    });
    const res = mockRes();

    Listing.findById.mockResolvedValue(null);

    await middlewares.isReviewAuthor(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
    expect(Review.findById).not.toHaveBeenCalled();
  });

  it("should pass a 404 error when the review does not exist", async () => {
    const req = mockReq({
      params: { id: listingId, reviewId },
    });
    const res = mockRes();

    Listing.findById.mockResolvedValue({
      reviews: [{ equals: (id) => id.toString() === reviewId }],
    });
    Review.findById.mockResolvedValue(null);

    await middlewares.isReviewAuthor(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

// ─── validateListing ───────────────────────────────────────────────────────────

describe("validateListing", () => {
  it("should call next for valid listing", () => {
    const req = mockReq({
      body: {
        listing: {
          title: "Beach House",
          description: "Beautiful beach house",
          location: "Goa",
          country: "India",
          price: 5000,
          category: "Trending",
        },
      },
    });
    const res = mockRes();

    middlewares.validateListing(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should pass ExpressError for invalid listing", () => {
    const req = mockReq({ body: { listing: { title: "" } } });

    middlewares.validateListing(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ExpressError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});

// ─── validateReview ────────────────────────────────────────────────────────────

describe("validateReview", () => {
  it("should call next for valid review", () => {
    const req = mockReq({
      body: { review: { rating: 4, comment: "Great place!" } },
    });
    const res = mockRes();

    middlewares.validateReview(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should pass ExpressError for invalid review", () => {
    const req = mockReq({ body: { review: { rating: 6 } } });

    middlewares.validateReview(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ExpressError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
});
