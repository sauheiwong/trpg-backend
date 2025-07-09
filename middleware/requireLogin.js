const isAuthenticated = async (req, res, next) => {
  console.log("req.isAuthenticated is :", req.isAuthenticated);
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).send({ message: "No authenticated" });
};

export default {
  isAuthenticated,
};
