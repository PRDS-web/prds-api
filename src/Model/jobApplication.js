import mongoose from "mongoose";

const jobApplicationSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        default: 'NA',
    },
    email: {
        type: String,
        required: true,
        default: 'NA'
    },
    phoneNumber: { 
        type: String,
        default: 'NA',
        required: true
    },
    experience: {
        type: String,
        required: true,
        default: 'NA'
    },
    linkedin: {
        type: String,
        required: true,
        default: 'NA'
    },
    skills: {
        type: Array,
        required: true,
        default: 'NA'
    },
    userId: {
        type: String,
        required: true,
    },
    jobId: {
        type: String,
        required: true,
    },
},{
    timestamps: true
});

const jobApplication = mongoose.model("jobApplication",jobApplicationSchema);

export default jobApplication;