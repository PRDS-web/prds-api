import mongoose from "mongoose";

const bankingDetails = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    bankName: {
        type: String,
        required: true
    },
    accountHolder: {
        type: String,
        required: true
    },
    accountIFSC: {
        type: String,
        required: true
    },
    accountNumber: {
        type: Object,
        required: true
    },
    accountLast4: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true,
    },
    upiId:{
        type: String,
        default: 'NA'
    },
    payPalId:{
        type: String,
        default: 'NA'
    }
},{
    timestamps: true
});

const bankingDetail = mongoose.model("bankingDetails",bankingDetails);

export default bankingDetail;