import User from "../models/userModel.js";

const register = async ({ username, password, callback }) => {
  await User.register(new User({ username }), password, callback);
};

export default {
  register,
};