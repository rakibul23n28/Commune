import jwt from "jsonwebtoken";

export const auth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    console.log(req.user);

    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    next();
  };

export const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user data to the request object
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};
