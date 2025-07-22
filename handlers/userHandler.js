import User from "../models/userModel.js";

const register = async ({ username, password, callback }) => {
  await User.register(new User({ username }), password, callback);
};

const edit = async (name, language, userId) => {
  try {
    await User.findByIdAndUpdate(userId, { name, language });
  } catch (error) {
    throw error;
  }
};

export default {
  register,
  edit,
};
