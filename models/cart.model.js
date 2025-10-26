import { Schema, model } from "mongoose";

const CartSchema = new Schema({
  products: {
    type: Array,
    default: [],
  },
});

export default model("Carts", CartSchema);