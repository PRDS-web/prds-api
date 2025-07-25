import User from "../Model/User.js";

export async function getUserInfo(req, res) {
    const userId = req.userId;
    console.log("User ID from request:", userId);
    try{
        // Fetch user information from the database using the userId and using (-) minus sign we are using in select
        // to exclude password and __v field from the response
        const user = await User.findById(userId).select("-password -__v -_id");
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
            users,
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