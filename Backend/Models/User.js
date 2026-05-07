import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: String,
    coverImage: String,
    bio: String,
    location: String,
    website: String,
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: 'user' },
    lastLogin: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;