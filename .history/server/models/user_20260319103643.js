import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: tru },
    email: { type: String, required: true,unique:true},
    password: { type: String, required: true },

})