import passport from "passport";
import local from "passport-local";
import userModel from "../models/users.model.js";
import { createHash, isValidPassword } from "../utils/index.js";
import jwt from "passport-jwt";
import dotenv from "dotenv"

dotenv.config()
const JWTStrategy = jwt.Strategy
const ExtractJWT = jwt.ExtractJwt
const LocalStrategy = local.Strategy;

const cookieExtractor = (req) => {
  
  let token = null 

  if(req && req.cookies)
    token = req.cookies["authCookie"]

  return token
}


const JWT_SECRET = process.env.JWT_SECRET;

const initializePassport = () => {
  passport.use(
    "register",
    new LocalStrategy(
      {
        passReqToCallback: true,
        usernameField: "email",
      },
      async (req, username, password, done) => {
        const { first_name, last_name, email,age,role } = req.body;
        try {
          const userFound = await userModel.findOne({ email: username });
          if (userFound) {
            console.log("Useuario existente en la db");
            return done(null, false);
          }
          const newUser = {
            first_name,
            last_name,
            email,
            age,
            role: role || "user",
            password: createHash(password),
          };
          const user = await userModel.create(newUser);
          return done(null, user);
        } catch (error) {
          return done(`Error al crear el usuario ${error}`, false);
        }
      }
    )
  );

  passport.use(
    "jwt",
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor, ExtractJWT.fromAuthHeaderAsBearerToken()]),
        secretOrKey: JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          const payloadUser = jwt_payload.user ? jwt_payload.user : jwt_payload
          const id = payloadUser.id || payloadUser._id

          if(!id) 
            return done (null, false, {message: "Token sin id"})

          const user = await userModel.findById(id).select("-password")

          if(!user)
            return done (null, false, {message: "Usuario no encontrado"})
          
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    try{
      const user = await userModel.findById(id);
      done(null, user);
    } catch(err){
      done(err, null)
    }
  });
};

export default initializePassport;
export {cookieExtractor};