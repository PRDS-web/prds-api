import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    userId: mongoose.Types.UUID,
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin','client'],
        default: 'user'
    },
    email: {
        type: String,
        required: true,
    },
    country: String, 
    picture: String,
    skills: {
        type: Array,
        default: []
    },
    linkedIn: String,
    mobileNumber: String,
    github: String,
    isVerified: Boolean,
    verificationToken: String,
    password: {
        type: String,
        required:  true
    },
    loggedInType: String,
    resetPasswordToken: String,
},{
    timestamps: true
});

const User = mongoose.model("Users",userSchema);

export default User;