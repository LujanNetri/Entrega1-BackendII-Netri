import { Router } from "express";
import { createHash, isValidPassword,generateToken } from "../utils/index.js";
import userModel from "../models/users.model.js";
import passport from "passport";

const router = Router();


router.post("/register", async (req, res) => {
  const { first_name, last_name, email, password, age } = req.body;
  try {
    const userExist = await userModel.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "El correo ya existe" });
    }
    const password_hash = createHash(password);
    const newUser = {
      first_name,
      last_name,
      email,
      age: age,
      password: password_hash,
    };
    const created = await userModel.create(newUser);
    res.status(201).redirect("/login");
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor", err: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExist = await userModel.findOne({ email: email });
    if (!userExist) 
      return res.status(401).json({message: "Usuario no encontrado"})

      const isValid = isValidPassword(password, userExist.password)

      if (!isValid) 
        return res.status(401).json({message: "Credenciales inválidas"})

        const userPayload = {
          id: userExist._id,
          first_name: userExist.first_name,
          last_name: userExist.last_name,
          email: userExist.email,
          age: userExist.age,
          role: userExist.role,
        }

        const token = generateToken(userPayload);

        res.cookie("authCookie", token, { maxAge: 3600000, httpOnly: true });
        res.redirect("/profile")
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor", err: error.mesage });
  }
});

router.get("/current", passport.authenticate("jwt", {session: false}), (req,res) =>{
  res.json({user:req.user})
})

router.post("/recupero", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userFound = await userModel.findOne({ email });

    if(!userFound)
      return res.status(404).json({message: "Usuario no encontrado"})

    const password_hash = createHash(password);
    userFound.password = password_hash;
    await userFound.save();
    res.redirect("/login");
  } catch (error) {
    res.status(500).json({message:"Error interno", err: error.message})
  }
});

router.post("/logout", (req, res) => {

  res.clearCookie("authCookie")
  if (req.session) {
    req.session.destroy((err) =>{
      if(err)
        return res.status(500).json({message: "Error al destruir la session"})
      return res.redirect("/")
    })
  } else {
    return res.redirect("/")
  }
});

const authorize = (allowedRoles = []) => (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "No autorizado" });
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return res.status(403).json({ error: "Permisos insuficientes" });
  }
  next()
}
export default router;
