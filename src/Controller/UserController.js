import User from "../Model/User.js";
import bankingDetail from "../Model/BankingDetails.js";
import bankDetailArchive from "../Model/bankDetailArchive.js";
import { encryptBankDetails, decryptBankDetails } from "../Utils/bankDetailEncrypt.js";
export async function getUserInfo(req, res) {
    const userId = req.userId;
    console.log("User ID from request:", userId);
    try{
        // Fetch user information from the database using the userId and using (-) minus sign we are using in select
        // to exclude password and __v field from the response
        const user = await User.findById(userId).select("-password -__v -_id -resetPasswordToken -verificationToken");
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                title: "Not Found",
                status: 404

            });
        }
        console.log("User information retrieved:", user);
        return res.status(200).json({
            user,
            message: "User information retrieved successfully.",
            title: "User Info",
            status: 200
        });

    }catch(error){
        console.error("Error fetching user info:", error);
        return res.status(500).json({
            message: "Internal server error while fetching user info.",
            title: "Server Error",
            status: 500
        });
    }
   
}
export async function getAllUsers(req, res) {
    try {
        const users = await User.find().select("-password -__v");
        console.log("All users retrieved:", users);
        return res.status(200).json({
            user: users,
            message: "All users retrieved successfully.",
            title: "All Users",
            status: 200
        });
    } catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({
            message: "Internal server error while fetching all users.",
            title: "Server Error",
            status: 500
        });
    }
}

export async function updateProfile(req, res) {
    const userId = req.userId;
    const { name, email, country, picture, skills, linkedIn, mobileNumber, github } = req.body;

    try {
        // Update user profile information in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, country, picture, skills, linkedIn, mobileNumber, github },
            { new: true }
        ).select("-password -__v");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
                title: "Not Found",
                status: 404
            });
        }

        console.log("User profile updated:", updatedUser);
        return res.status(200).json({
            user: updatedUser,
            message: "Profile updated successfully.",
            title: "Profile Updated",
            status: 200
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({
            message: "Internal server error while updating profile.",
            title: "Server Error",
            status: 500
        });
    }
}

export async function updateRole (req, res) {
    const { userId, role } = req.body;

    if (!userId || !role) {
        return res.status(400).json({
            message: "User ID and role are required.",
            title: "Bad Request",
            status: 400
        });
    }


    try {
        // Update user role in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select("-password -__v");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found.",
                title: "Not Found",
                status: 404
            });
        }

        console.log("User role updated:", updatedUser);
        return res.status(200).json({
            user: updatedUser,
            message: "User role updated successfully.",
            title: "Role Updated",
            status: 200
        });

    } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).json({
            message: "Internal server error while updating user role.",
            title: "Server Error",
            status: 500
        });
    }

}
export const updateBankDetails = async(req, res) =>{
    let {bankName, accountHolder, accountIFSC, accountNumber, accountType, upiId, paypalId} = req.body;
    if( !bankName || !accountHolder || !accountIFSC || !accountType){
        return res.status(400).json({
            message: "Required fields are missing",
            status: 400
        });
    }
    try{
        // const encryptedAccountIFSC = encryptBankDetails(accountIFSC);
        
        const userId = req.userId;
        console.log("Updating bank details for user ID:", userId);
        const CurrentbankingDetail = await bankingDetail.findOne({userId});
        if(!CurrentbankingDetail){
            const encryptedAccountNumber =  encryptBankDetails(accountNumber);
            console.log("No existing bank details found for user, creating new entry.");
            const newBankingDetail = new bankingDetail({
                userId,
                bankName,
                accountHolder,
                accountIFSC: accountIFSC,
                accountNumber: encryptedAccountNumber,
                accountLast4: accountNumber.slice(-4),
                accountType,
                upiId,
                payPalId: paypalId
            });
            const saveedAccount =await newBankingDetail.save();
            await User.findByIdAndUpdate(userId, { bankAccountId: saveedAccount._id }).exec();
            console.log("New banking details saved.");
        } else {
            // Archive existing banking details before updating
            console.log("bank details already exist for user, archiving old details.");
            if(!accountNumber || accountNumber.trim().length === 0){
                accountNumber = CurrentbankingDetail.accountNumber;
            }else{
                accountNumber = encryptBankDetails(accountNumber);
            }
            const bankaccountDecrypted = decryptBankDetails(CurrentbankingDetail.accountNumber);
            if(bankaccountDecrypted === accountNumber && CurrentbankingDetail.accountIFSC === accountIFSC && 
                CurrentbankingDetail.accountType === accountType && CurrentbankingDetail.bankName === bankName &&
                CurrentbankingDetail.accountHolder === accountHolder && CurrentbankingDetail.upiId === upiId &&
                CurrentbankingDetail.payPalId === paypalId){
                    return res.status(400).json({
                        message: "No changes detected. there is nothing to update.",
                        status: 400
                    });
                }
            const archiveEntry = new bankDetailArchive({
                userId: CurrentbankingDetail.userId,
                bankName: CurrentbankingDetail.bankName,
                accountHolder: CurrentbankingDetail.accountHolder,
                accountIFSC: CurrentbankingDetail.accountIFSC,
                accountType: CurrentbankingDetail.accountType,
                upiId: CurrentbankingDetail.upiId,
                payPalId: CurrentbankingDetail.payPalId,
                accountNumber: CurrentbankingDetail.accountNumber,
                accountLast4: CurrentbankingDetail.accountLast4
            });
            await archiveEntry.save();

            console.log("Old banking details archived.");

            // Update with new details
            CurrentbankingDetail.bankName = bankName;
            CurrentbankingDetail.accountHolder = accountHolder;
            CurrentbankingDetail.accountIFSC = accountIFSC;
            CurrentbankingDetail.accountType = accountType;
            CurrentbankingDetail.accountNumber = accountNumber;
            CurrentbankingDetail.accountLast4 = typeof accountNumber === "object" ? CurrentbankingDetail.accountLast4 : accountNumber.slice(-4);
            CurrentbankingDetail.upiId = upiId;
            CurrentbankingDetail.payPalId = paypalId;
            const updated= await CurrentbankingDetail.save();
            await User.findByIdAndUpdate(userId, { bankAccountId: updated._id }).exec();
            console.log("New banking details updated.");
        }
        return res.status(200).json({
             message: "Banking details updated successfully.",
                status: 200
        });
       
    }catch(error){
       return res.status(500).json({
            message: "Error updating banking details",
            error: error.message,
            status: 500
        });
    }
}

export const getBankDetails = async(req, res) =>{
    const userId = req.userId;
    try{
        const bankingDetails = await bankingDetail.findOne({userId}).select("-accountNumber -__v -_id -userId -updatedAt");;
        if(!bankingDetails){
            return res.status(404).json({
                message: "No banking details found for this user.",
                status: 404
            });
        }
        return res.status(200).json({
            message: "Banking details retrieved successfully.",
            bankingDetails,
            status: 200
        });
    }catch(error){
        return res.status(500).json({
            message: "Error retrieving banking details",
            error: error.message,
            status: 500
        });
    }
}
export const getBankinghistory = async(req, res) =>{
    const userId = req.userId;
    try{
        const bankingDetailsHistory = await bankDetailArchive.find({userId}).select("-accountNumber -__v -_id -userId").sort({ createdAt: -1 });
        if(bankingDetailsHistory.length === 0){
            return res.status(404).json({
                message: "No banking details history found for this user.",
                status: 404
            });
        }
        return res.status(200).json({
            message: "Banking details history retrieved successfully.",
            bankingDetailsHistory,
            status: 200
        });
    }catch(error){
        return res.status(500).json({
            message: "Error retrieving banking details history",
            error: error.message,
            status: 500
        });
    }
}