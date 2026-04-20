const userController = require("../../controllers/users");
const User = require("../../models/user");

// ✅ Mock User model
jest.mock("../../models/user");

// ─── Helpers ───────────────────────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  body: {},
  flash: jest.fn(),
  login: jest.fn((user, cb) => cb(null)),
  logout: jest.fn((cb) => cb(null)),
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.locals = { redirectUrl: null };
  return res;
};

// ─── renderSignupForm ──────────────────────────────────────────────────────────

describe("userController.renderSignupForm", () => {
  it("should render signup form", () => {
    const req = mockReq();
    const res = mockRes();

    userController.renderSignupForm(req, res);

    expect(res.render).toHaveBeenCalledWith("users/signup.ejs");
  });
});

// ─── renderLoginForm ───────────────────────────────────────────────────────────

describe("userController.renderLoginForm", () => {
  it("should render login form", () => {
    const req = mockReq();
    const res = mockRes();

    userController.renderLoginForm(req, res);

    expect(res.render).toHaveBeenCalledWith("users/login.ejs");
  });
});

// ─── signup ────────────────────────────────────────────────────────────────────

describe("userController.signup", () => {
  it("should register user and redirect to listings", async () => {
    const req = mockReq({
      body: {
        username: "vedanti",
        email: "vedanti@test.com",
        password: "pass123",
      },
    });
    const res = mockRes();

    const fakeUser = { _id: "user123", username: "vedanti" };
    User.mockImplementation(() => fakeUser);
    User.register = jest.fn().mockResolvedValue(fakeUser);

    await userController.signup(req, res);

    expect(User.register).toHaveBeenCalled();
    expect(req.login).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith("success", "Welcome to TripTales!");
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should flash error and redirect to signup on failure", async () => {
    const req = mockReq({
      body: {
        username: "vedanti",
        email: "vedanti@test.com",
        password: "pass123",
      },
    });
    const res = mockRes();

    User.mockImplementation(() => ({}));
    User.register = jest
      .fn()
      .mockRejectedValue(new Error("Username already exists"));

    await userController.signup(req, res);

    expect(req.flash).toHaveBeenCalledWith("error", "Username already exists");
    expect(res.redirect).toHaveBeenCalledWith("/signup");
  });
});

// ─── login ─────────────────────────────────────────────────────────────────────

describe("userController.login", () => {
  it("should flash success and redirect to /listings by default", async () => {
    const req = mockReq();
    const res = mockRes();
    res.locals.redirectUrl = null;

    await userController.login(req, res);

    expect(req.flash).toHaveBeenCalledWith("success", "Welcome to TripTales!");
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should redirect to saved redirectUrl if present", async () => {
    const req = mockReq();
    const res = mockRes();
    res.locals.redirectUrl = "/listings/123";

    await userController.login(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/listings/123");
  });
});

// ─── logout ────────────────────────────────────────────────────────────────────

describe("userController.logout", () => {
  it("should logout and redirect to /listings", () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    userController.logout(req, res, next);

    expect(req.logout).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith("success", "You are logged out!");
    expect(res.redirect).toHaveBeenCalledWith("/listings");
  });

  it("should call next with error if logout fails", () => {
    const req = mockReq({
      logout: jest.fn((cb) => cb(new Error("Logout failed"))),
    });
    const res = mockRes();
    const next = jest.fn();

    userController.logout(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
