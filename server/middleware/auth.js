const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail } = require("../utils/access");
async function authenticate(req, optional) {
  const header = req.get("Authorization");
  if (!header && optional) return;
  if (!header?.startsWith("Bearer ")) fail(401, "Please log in to continue");
  if (!process.env.JWT_SECRET) fail(503, "Account sign-in is not configured");
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "poppin",
      audience: "poppin-web",
    });
  } catch {
    fail(401, "Your session has expired. Please log in again");
  }
  const user = await User.findById(payload.sub);
  if (!user?.isActive) fail(401, "Your account is unavailable");
  req.user = user;
}
const requireAuth = async (req, res, next) => {
  try {
    await authenticate(req, false);
    next();
  } catch (err) {
    next(err);
  }
};
const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, true);
    next();
  } catch (err) {
    next(err);
  }
};
module.exports = { requireAuth, optionalAuth };
