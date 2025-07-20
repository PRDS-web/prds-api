import mongoose from "mongoose";

const userSchema = mongoose.Schema({
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
    country: { 
        type: String,
        default: 'NA' 
    }, 
    picture: { 
        type: String,
        default: null 
    },
    skills: {
        type: Array,
        default: []
    },
    linkedIn: { 
        type: String,
        default: 'NA' 
    },
    mobileNumber: { 
        type: String, 
        default: 'NA'
    },
    github: { 
        type: String, 
        default: 'NA' 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    verificationToken: { 
        type: String, 
        default: 'NA' 
    },
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