const listingController = require("../../controllers/listings");
const Listing = require("../../models/listing");
const ExpressError = require("../../utils/ExpressError");
const mongoose = require("mongoose");

// ✅ Mock all external dependencies
jest.mock("../../models/listing");
jest.mock("@mapbox/mapbox-sdk/services/geocoding", () => () => ({
  forwardGeocode: () => ({
    send: jest.fn(),
  }),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  flash: jest.fn(),
  user: { _id: new mongoose.Types.ObjectId() },
  file: undefined,
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// ─── index ─────────────────────────────────────────────────────────────────────

describe("listingController.index", () => {
  it("should render index with all listings", async () => {
    const req = mockReq();
    const res = mockRes();
    const fakeListings = [
      { title: "Beach House" },
      { title: "Mountain Cabin" },
    ];

    Listing.find.mockResolvedValue(fakeListings);

    await listingController.index(req, res);

    expect(Listing.find).toHaveBeenCalledWith({});
    expect(res.render).toHaveBeenCalledWith("listings/index.ejs", {
      allListings: fakeListings,
    });
  });
});

// ─── renderNewForm ─────────────────────────────────────────────────────────────

describe("listingController.renderNewForm", () => {
  it("should render new listing form", () => {
    const req = mockReq();
    const res = mockRes();

    listingController.renderNewForm(req, res);

    expect(res.render).toHaveBeenCalledWith("listings/new.ejs");
  });
});

// ─── showListing ───────────────────────────────────────────────────────────────

describe("listingController.showListing", () => {
  it("should render listing if found", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({ params: { id } });
    const res = mockRes();

    const fakeListing = { _id: id, title: "Beach House", reviews: [] };
    const populateMock = jest.fn().mockResolvedValue(fakeListing);
    const populateMock2 = jest.fn().mockReturnValue({ populate: populateMock });
    Listing.findById.mockReturnValue({ populate: populateMock2 });

    await listingController.showListing(req, res);

    expect(res.render).toHaveBeenCalledWith("listings/show.ejs", {
      listing: fakeListing,
    });
  });

  it("should redirect if listing not found", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({ params: { id } });
    const res = mockRes();

    const populateMock = jest.fn().mockResolvedValue(null);
    const populateMock2 = jest.fn().mockReturnValue({ populate: populateMock });
    Listing.findById.mockReturnValue({ populate: populateMock2 });

    await listingController.showListing(req, res);

    expect(req.flash).toHaveBeenCalledWith("error", expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should throw ExpressError for invalid ID", async () => {
    const req = mockReq({ params: { id: "invalid-id" } });
    const res = mockRes();

    await expect(
      listingController.showListing(req, res),
    ).rejects.toBeInstanceOf(ExpressError);
  });
});

// ─── renderEditForm ────────────────────────────────────────────────────────────

describe("listingController.renderEditForm", () => {
  it("should render edit form if listing found", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({ params: { id } });
    const res = mockRes();

    const fakeListing = {
      _id: id,
      title: "Beach House",
      image: { url: "https://res.cloudinary.com/upload/image.jpg" },
    };
    Listing.findById.mockResolvedValue(fakeListing);

    await listingController.renderEditForm(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "listings/edit.ejs",
      expect.objectContaining({
        listing: fakeListing,
      }),
    );
  });

  it("should redirect if listing not found", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({ params: { id } });
    const res = mockRes();

    Listing.findById.mockResolvedValue(null);

    await listingController.renderEditForm(req, res);

    expect(req.flash).toHaveBeenCalledWith("error", expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should throw ExpressError for invalid ID", async () => {
    const req = mockReq({ params: { id: "bad-id" } });
    const res = mockRes();

    await expect(
      listingController.renderEditForm(req, res),
    ).rejects.toBeInstanceOf(ExpressError);
  });
});

// ─── destroyListing ────────────────────────────────────────────────────────────

describe("listingController.destroyListing", () => {
  it("should delete listing and redirect", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({ params: { id } });
    const res = mockRes();

    Listing.findByIdAndDelete.mockResolvedValue({});

    await listingController.destroyListing(req, res);

    expect(Listing.findByIdAndDelete).toHaveBeenCalledWith(id);
    expect(req.flash).toHaveBeenCalledWith("success", "Listing Deleted!");
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should throw ExpressError for invalid ID", async () => {
    const req = mockReq({ params: { id: "bad-id" } });
    const res = mockRes();

    await expect(
      listingController.destroyListing(req, res),
    ).rejects.toBeInstanceOf(ExpressError);
  });
});

// ─── updateListing ─────────────────────────────────────────────────────────────

describe("listingController.updateListing", () => {
  it("should update listing and redirect", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const req = mockReq({
      params: { id },
      body: { listing: { title: "Updated Title" } },
      file: undefined,
    });
    const res = mockRes();

    const fakeListing = { _id: id, title: "Updated Title", save: jest.fn() };
    Listing.findByIdAndUpdate.mockResolvedValue(fakeListing);

    await listingController.updateListing(req, res);

    expect(req.flash).toHaveBeenCalledWith("success", "Listing Updated!");
    expect(res.redirect).toHaveBeenCalledWith(`/listings/${id}`);
  });

  it("should throw ExpressError for invalid ID", async () => {
    const req = mockReq({ params: { id: "bad-id" }, body: { listing: {} } });
    const res = mockRes();

    await expect(
      listingController.updateListing(req, res),
    ).rejects.toBeInstanceOf(ExpressError);
  });
});
