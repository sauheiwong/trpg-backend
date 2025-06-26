const isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(403).send({ message: "No authenticated" });
};

export default {
  isAuthenticated,
};
