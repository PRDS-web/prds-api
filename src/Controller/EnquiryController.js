import { validateEmail } from "../Validator/FormValidator.js";
import Enquiry from "../Model/Enquiry.js";
import { sendEmailForFirstTimeVerification } from "../Utils/Mail/Mailer.js";

export const userEnquiry = async (req,res) => {
    let { email, name, country, message } = req.body;

    if(email== null || name == null || country ==null || message == null){
        return res.status(400).json({
            message: "Invalid data values can not be null",
            status: 400,
            title: "Bad Request"
        })
    }
    name = name.trim();
    email = email.trim();
    country = country.trim();
    message = message.trim();
    if(email== '' || name == '' || country == '' || message == ''){
        return res.status(400).json({
            message: "Data can not be empty",
            status: 400,
            title: "Bad Request"
        })
    }
    console.log("Validating Email id ", email);

    const isEmailValid = await validateEmail(email);
    if(!isEmailValid){
        return res.status(400).json({
            message: "Please enter valid email id",
            status: '400',
            title: 'Invalid Email Id'
        })
    }

    const enquiry = await Enquiry.create({
          name,
          email,
          country,
          message
        });

    await enquiry.save();

    sendEmailForFirstTimeVerification(enquiry, "contact us").catch(
          (error) => {
            console.log("There is something went wrong from email service", error);
          }
        );
    return res.status(200).json({
        message: "Enquiry saved",
        title: "Enquiry Status",
        status: 200
    })
}
export const getAllEnquiries = async (req,res) => {
    try {
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }); 
        return res.status(200).json({
            enquiries,
            message: "Enquiries fetched successfully",
            title: "Enquiries",
            status: 200
        });
    } catch (error) {
        console.error("Error fetching enquiries:", error);
        return res.status(500).json({
            message: "Internal server error while fetching enquiries.",
            title: "Server Error",
            status: 500
        });
    }   
}