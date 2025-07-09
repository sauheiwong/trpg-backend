import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

const secretOrKey = process.env.JWT_SECRET_KEY;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretOrKey,
};

export default (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // console.log("JWT Payload: ", jwt_payload);

        const user = await User.findById(jwt_payload.id);

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        console.error("config passport.js error: ", err);
        return done(err, false);
      }
    })
  );
};
