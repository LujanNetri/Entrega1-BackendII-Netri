import {Router} from "express"
import userModel from "../models/users.model.js"
import { createHash } from "../utils/index.js";
import passport from "passport";

const router = Router()

router.get("/", passport.authenticate("jwt", {session:false}), async(req,res) =>{
  try {
    if(req.user.role !== "admin")
        return res.status(403).json({message: "Acceso no autorizado"}) 
    
    const users = await userModel.find().populate("cart")
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({message: "Error al obtener usuarios",error: error.message})
  }
})

router.get("/:id", passport.authenticate("jwt", {session: false}), async(req,res) =>{
  try {
    const { id } = req.params;
    const loggedUser = req.user; 
    
    if (req.user.id !== id && loggedUser.role !== "admin") 
        return res.status(403).json({ message: "No tienes permiso para ver este perfil" });
    
    const user = await userModel.findById(req.params.id).populate("cart")
    
    if (!user) 
        return res.status(404).json({ message: "Usuario no encontrado" });
    
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({message: "Error al obtener usuario",error:error.mesagge})
  }
})

router.post("/", async (req,res) =>{
    try {
        const {first_name, last_name, email, age, password, cart, role} = req.body

        if(!first_name || !last_name || !email || !age || !password)
        return res.status(400).json({message: "Faltan campos obligatorios"})

        const existingUser = await userModel.findOne({email})

        if(existingUser) 
            return res.status(400).json({message: "El email ya está registrado"})

        const password_hash = createHash(password)

        const newUser = await userModel.create({
            first_name,
            last_name,
            email,
            age,
            password: password_hash,
            cart: cart || null,
            role: role || "user",
        })

        res.status(201).json({
            message: "Usuario creado correctamente",
            user: newUser,
        })
    } catch (error) {
        res.status(500).json({message:"Error al crear el usuario", error:error.message})
    }
})

router.put("/:id", passport.authenticate("jwt", {session:false}), async(req, res) =>{
    try {
        const {password, ...data} = req.body

        if(password)
            data.password = createHash(password)

        const updatedUser = await userModel.findByIdAndUpdate(req.params.id,
            data,
            {new: true}
        )

        if(!updatedUser)
            return res.status(404).json({message: "Usuario no encontrado"})

        res.status(200).json({message: "Usuario actualizado correctamente", user:updatedUser})

    } catch (error) {
        res.status(500).json({message:"Error al actualizar usuario", error: error.mesagge})
    }
})

router.delete("/:id", passport.authenticate("jwt",{session:false}), async (req,res) => {
    try {
        const deletedUser = await userModel.findByIdAndDelete(req.params.id)

        if(!deletedUser)
            return res.status(404).json({message: "Usuario no encotrado"})
        
        res.status(200).json({message: "Usuario eliminado correctamente"})
    } catch (error) {
        res.status(500).json({message:"Error al eliminar usuario", error: error.mesagge})   
    }
}
)

export default router;