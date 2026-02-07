import mongoose from "mongoose";

const bankingDetailsArchive = mongoose.Schema({
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
    accountType: {
        type: String,
        required: true,
    },
     accountNumber: {
        type: Object,
        required: true
    },
    accountLast4: {
        type: String,
        required: true
    },
    upiId:{
        type: String
    }
},{
    timestamps: true
});

const bankingDetailArchive = mongoose.model("bankingDetailsArchive",bankingDetailsArchive);

export default bankingDetailArchive;