import express from "express";
import { engine } from "express-handlebars";
import { join, __dirname } from "./utils/index.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import sessionsRoutes from "./routes/session.routes.js";
import userCrudRoutes from "./routes/users.routes.js";
import viewRoutes from "./routes/views.routes.js";
import initializePassport from "./config/passport.config.js";
import passport from "passport";
import dotenv from "dotenv";
import "./models/cart.model.js";

const app = express();
app.set("PORT", process.env.PORT);
const url = process.env.MONGO_URL;
const secret = process.env.SESSION_SECRET;
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", join(__dirname, "views"));
dotenv.config()

console.log("Conectando a:", url);

const connectDb = async (url) => {
  try {
    await mongoose.connect(url);
    console.log("Conexion exitosa");
  } catch (error) {
    console.log("error de conexion");
  }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "../public")));
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: url,
      ttl: 60000,
    }),
    secret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(cookieParser());
app.use(express.static("src/public"))
initializePassport();
app.use(passport.initialize());
app.use("/api/users", userCrudRoutes)


app.get("/", (req, res) => {
  res.render("home", { title: "HOME" });
});
app.use("/api/sessions", sessionsRoutes);
app.use("/", viewRoutes);
connectDb(url);
//listeners
app.listen(app.get("PORT"), () => {
  console.log(`Server on port http://localhost:${app.get("PORT")}`);
});
