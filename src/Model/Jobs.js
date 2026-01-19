import mongoose from "mongoose";

const jobSchema = mongoose.Schema({
    jobTitle: {
        type: String,
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
        default: 'NA'
    },
    country: { 
        type: String,
        default: 'NA',
        required: true
    },
    jobStatus: {
        type: String,
        required: true,
        default: 'NA'
    },
    lastdateToApply: {
        type: Date,
        default: null,
        required: true
    },
    jobLocation: {
        type: String,
        required: true,
        default: 'NA'
    },
    jobType: {
        type: String,
        required: true,
        default: 'NA'
    },
    appliedCandidates: {
        type: Array,
        default: []
    },
    skillsRequired: {
        type: Array,
        default: [],
        required: true,
    }
},{
    timestamps: true
});

const job = mongoose.model("job",jobSchema);

export default job;