import {
  validateEmail,
  validateRegisterUserIntput,
} from "../Validator/FormValidator.js";
import User from "../Model/User.js";
import argon from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmailForFirstTimeVerification } from "../Utils/Mail/Mailer.js";

export async function registerUser(req, res) {
  const { email, password, confirmPassword } = req.body;
  const validateIntput = validateRegisterUserIntput(
    email.trim(),
    password.trim(),
    confirmPassword.trim()
  );
  try {
    if (Object.keys(validateIntput).length != 0) {
      return res.status(400).json(validateIntput);
    }
    //Checking if user already present in DB or not
    const isUserAlreadyPresent = await User.findOne({ email });

    //Its mean user already exits in DB
    if (isUserAlreadyPresent) {
      return res.status(409).json({
        message:
          "This email id already present. Please try with different Email or try to reset password",
        error: "Email Id already present",
      });
    }

    const hashedPassword = await argon.hash(password);
    const userName = email.split("@")[0];
    const newUser = await User.create({
      name: userName,
      email,
      password: hashedPassword,
      loggedInType: "EmailAndPassword",
    });
    const jwtToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      issuer: "prds-api",
    });

    console.log("Cookies generated successfully");

    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const token = crypto.randomBytes(32).toString("hex");
    newUser.verificationToken = token;
    await newUser.save();

    console.log("User saved in DB, Now sending mail for verification");

    sendEmailForFirstTimeVerification(newUser).catch((error) => {
      console.log("There is something went wrong from email service", error);
    });

    console.log("Verification mail tried to send", newUser.email);

    return res.status(201).json({
      message: "User registered successfully",
      title: "User Registration",
    });
  } catch (error) {
    console.log("there is something wrong", error);
    res.status(500).json({
      message: "There is something went wrong please try again later",
      error: "Something went wrong",
      title: "User Registration",
    });
  }
}

export async function verifyUser(req, res) {
  const verificationToken = req.query.token;
  try {
    console.log("Checking token if it there in db or not", verificationToken);
    const isTokenThere = await User.findOne({ verificationToken });
    if (!isTokenThere) {
      return res.status(404).json({
        message:
          "User verification failed please again request for verification",
        error: "User verification failed",
        title: "User Verification",
      });
    }
    if (isTokenThere.isVerified) {
      return res.status(200).json({
        title: "Already verifiyed",
        message: "User verification successful",
      });
    }
    isTokenThere.isVerified = true;
    await isTokenThere.save();
    return res.status(200).json({
      title: "Verification Successfully",
      message: "User verification successful",
    });
  } catch (error) {
    console.log("Something went wrong from verifyUser method", error);
    res.status(500).json({});
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      title: "Invalid Request",
      message: "Please enter all mandtory field",
    });
  }

  const isValidUser = await User.findOne({ email });

  if (isValidUser == null || isValidUser == undefined) {
    return res.status(404).send({
      title: "User Not found",
      message: "Unable to find the user. Please pass correct value",
    });
  }
  const isValidPassword = await argon.verify(isValidUser.password, password);
  console.log("from login user", isValidPassword);

  if (!isValidPassword) {
    res.clearCookie("authToken");
    return res.status(401).json({
      title: "Incorrect Password",
      message: "Password is not correct. please enter valid password",
    });
  }
  //generating token and setting token
  const jwtToken = jwt.sign({ id: isValidUser._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    issuer: "prds-api",
  });

  console.log("Cookies generated successfully");

  res.cookie("authToken", jwtToken, {
    httpOnly: true,
    secure: true,
    sameSite: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return res.status(200).json({
    title: "Valid Password",
    message: "Login Successfully",
  });
}

export function logoutUser(req, res) {
  res.clearCookie("authToken");
  return res.status(200).json({
    title: "User Logout",
    message: "Logout Successfully",
  });
}

export function SSOSignin(req,res){

}