import jwt from 'jsonwebtoken';
import env from 'dotenv';
import User from '../Model/User.js';

env.config();

export async function verifyToken(req, res, next) {
    const token = req.cookies.authToken;
    console.log("Token received:", token); 
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing, please login again.",
            title: "Unauthorized Access",
            status: 401
        });
    }
    try {
        // here we are verifying the token using jwt secret to make sure it is valid and then extracting the info from it
        const {id, exp, iss} = jwt.verify(token, process.env.JWT_SECRET);
        if(iss !== process.env.ISSUER) {
            return res.status(401).json({
                message: "Unauthorized access, invalid token issuer, please login again.",
                title: "Unauthorized Access",
                status: 401
            });
        }
        // Check if the token has expired as we are expire info in seconds thats why we are comparing
        //  it with Math.floor(new Date()/1000) that will return value in seconds
        if(exp< Math.floor(new Date()/1000)){
            return res.status(401).json({
                message: "Unauthorized access, token has expired, please login again.",
                title: "Unauthorized Access",
                status: 401
            });
        }
        // If everything is fine we are attaching the user id to the request object so that we can use it
        req.userId = id;
        console.log("User ID from token:", req.userId); 
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token, please login again.",
            title: "Unauthorized Access",
            status: 401
        });
    }
}

export async function verifyAdmin(req, res, next) {
    const userId = req.userId;
    console.log("User ID from request:", userId);
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                title: "Not Found"
            });
        }
        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden access, admin role required.",
                title: "Forbidden"
            });
        }
        next();
    } catch (error) {
        console.error("Error verifying admin:", error);
        return res.status(500).json({
            message: "Internal server error while verifying admin.",
            title: "Server Error"
        });
    }
}