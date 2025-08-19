import mongoose from "mongoose";

const enquirySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        default: 'NA'
    },
    country: { 
        type: String,
        default: 'NA',
        required: true
    },
    message: {
        type: String,
        required: true,
        default: 'NA'
    },
},{
    timestamps: true
});

const enquiry = mongoose.model("Users",enquirySchema);

export default enquiry;