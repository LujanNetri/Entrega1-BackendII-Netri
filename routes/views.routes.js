import { Router } from "express";
import { verifyToken } from "../utils/index.js";
import passport from "passport";
const router = Router();

router.get("/register", (req, res) => {
  res.render("register", { title: "REGISTER" });
});

router.get("/login", (req, res) => {
  res.render("login", { title: "LOGIN" });
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const user = req.user.toJSON()
    res.render("profile", {title: "PROFILE", user });
  }
);
router.get("/recupero", (req, res) => {
  res.render("recupero", { title: "Recuperar password" });
});
export default router;
