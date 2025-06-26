export const catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch(next);
  };
};

export const notFound = (req, res, next) => {
  const err = new Error("⚠️ Not Found");
  err.status = 404;
  next(err);
};

export const flashValidationErrors = (err, req, res, next) => {
  if (!err.errors) return next(err);

  const errorKeys = Object.keys(err.errors);
  console.log("my errorkeys: ", errorKeys);
  errorKeys.forEach((key) => req.flash("error", err.errors[key].message));
  res.redirect("/");
};

export const errorStatus = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const errorReturn = (res, error) => {
  if (!error.statusCode) {
    console.error(error);
    error.statusCode = 500;
    error.message = "sever error";
  }
  return res.status(error.statusCode).send({ message: error.message });
};
