import {
  validateEmail,
  validateRegisterUserIntput,
} from "../Validator/FormValidator.js";
import User from "../Model/User.js";
import argon from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmailForFirstTimeVerification } from "../Utils/Mail/Mailer.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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
    const isUserAlreadyPresent = await User.findOne({ email: email.trim() });

    //this means user already exists in DB
    if (isUserAlreadyPresent) {
      return res.status(409).json({
        message:
          "This email id already present. Please try with different Email or try to reset password",
        error: "Email Id already present",
        title: "User Registration",
        status: 409,
      });
    }
    //Checking if email is valid or not
    const isEmailValid = await validateEmail(email.trim());

    console.log("Email validation result:", isEmailValid);

    if (isEmailValid == null || isEmailValid == undefined) {
      return res.status(400).json({
        message: "Network Error while validating email",
        error: "Network Error",
        title: "User Registration",
        status: 400,
      });
    }

    if (isEmailValid.status == "invalid") {
      return res.status(400).json({
        message: "Please enter valid email id",
        error: "Invalid Email Id",
        title: "User Registration",
        status: 400,
      });
    }
    if (isEmailValid.status == "disposable") {
      return res.status(400).json({
        message:
          "Please enter valid email id. Temporary email id is not allowed",
        error: "Invalid Email Id",
        title: "User Registration",
        status: 400,
      });
    }
    if (isEmailValid.status == "unknown") {
      return res.status(400).json({
        message: "Please enter valid email id",
        error: "Invalid Email Id",
        title: "User Registration",
        status: 400,
      });
    }

    console.log("Email is valid, proceeding with registration");
    //Checking if user already present in DB or not

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
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const token = crypto.randomBytes(32).toString("hex");
    newUser.verificationToken = token;
    await newUser.save();

    console.log("User saved in DB, Now sending mail for verification");

    sendEmailForFirstTimeVerification(newUser, "verification").catch(
      (error) => {
        console.log("There is something went wrong from email service", error);
      }
    );

    console.log("Verification mail tried to send", newUser.email);

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification",
      title: "User Registration",
      status: 201,
    });
  } catch (error) {
    console.log("there is something wrong", error);
    res.status(500).json({
      message: "There is something went wrong please try again later",
      error: "Something went wrong",
      title: "User Registration",
      status: 500,
    });
  }
}

export async function verifyUser(req, res) {
  const verificationToken = req.query.token;
  try {
    console.log("Checking token if it there in db or not", verificationToken);
    const isTokenThere = await User.findOne({ verificationToken });
    if (!isTokenThere) {
      return res.status(404).send(`
  <html>
    <head>
      <title>404 - Not Found</title>
      <style>
        body { font-family: Arial; text-align: center; margin-top: 50px; }
        .error { color: red; font-size: 1.5em; }
      </style>
    </head>
    <body>
      <div class="error">404 - Page Not Found</div>
      <p>Verification link is invalid. Please try again requesting Verification link using forgot password</p>
    </body>
  </html>
`);
    }
    if (isTokenThere.isVerified) {
      return res.status(200).send(`<html>
    <head>
      <title>Already Verified</title>
      <style>
        body { font-family: Arial; text-align: center; margin-top: 50px; }
        .info { color: #007bff; font-size: 1.5em; }
      </style>
    </head>
    <body>
      <div class="info">Your email is already verified!</div>
      <p>You can now log in and use your account.</p>
    </body>
  </html>
`);
    }
    isTokenThere.isVerified = true;
    isTokenThere.verificationToken = null; // Clear the verification token after successful verification
    await isTokenThere.save();
    return res.status(200).send(` <html>
      <head>
        <title>Verification Successful</title>
        <style>
          body { font-family: Arial; text-align: center; margin-top: 50px; }
          .success { color: green; font-size: 1.5em; }
        </style>
      </head>
      <body>
        <div class="success">Your email has been successfully verified!</div>
        <p>You can now close this page and log in.</p>
      </body>
  </html>`);
  } catch (error) {
    console.log("Something went wrong from verifyUser method", error);
    return res.status(500).send(`
  <html>
    <head>
      <title>Internal Server Error</title>
      <style>
        body { font-family: Arial; text-align: center; margin-top: 50px; }
        .error { color: #dc3545; font-size: 1.5em; }
      </style>
    </head>
    <body>
      <div class="error">500 - Internal Server Error</div>
      <p>There was a problem while verifying your account. Please try again later.</p>
    </body>
  </html>
`);
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send({
      title: "Invalid Request",
      message: "Please enter all mandtory field",
      status: 400,
    });
  }

  const isValidUser = await User.findOne({ email }).select(
      "-__v -createdAt -updatedAt -role -country -skills -linkedIn -mobileNumber -github -verificationToken -loggedInType -resetPasswordToken"
    );

  if (isValidUser == null || isValidUser == undefined) {
    return res.status(404).send({
      title: "User Not found",
      message: "Unable to find the user. Please pass correct email",
      status: 404,
    });
  }
  if (!isValidUser.isVerified) {
    return res.status(403).send({
      title: "User Not Verified",
      message: "Please verify your email before logging in",
      status: 403,
    });
  }
  const isValidPassword = await argon.verify(isValidUser.password, password);
  console.log("from login user", isValidPassword);

  if (!isValidPassword) {
    res.clearCookie("authToken");
    return res.status(401).json({
      title: "Incorrect Password",
      message: "Password is not correct. please enter valid password",
      status: 401,
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
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  //const { _id, password: _, ...userWithoutId } = isValidUser.toObject(); // Remove _id and password from the response

  return res.status(200).json({
    title: "Valid Password",
    message: "Login Successfully",
    status: 200,
  });
}

export function logoutUser(req, res) {
  res.clearCookie("authToken");
  return res.status(200).json({
    title: "User Logout",
    message: "Logout Successfully",
    status: 200,
  });
}

export async function SSOSignin(req, res) {
  const code = req.query.code;
  //this is use for redirecting back to the origin URL after successful SSO login
  const originUrl = req.get("origin");

  if (!code) {
    return res.status(400).json({
      title: "Invalid Request",
      message: "Please pass the code in query params",
      status: 400,
    });
  }

  console.log("Code received from SSO", code);
  const token = await getAccessToken(code, originUrl);
  console.log("Access token received from SSO");
  if (!token) {
    return res.status(500).json({
      title: "Internal Server Error",
      message: "There is something went wrong while getting access token",
      status: 500,
    });
  }
  console.log("Access token received from SSO");
  const userInfo = await getUserInfo(token);
  try {
    if (!userInfo) {
      return res.status(500).json({
        title: "Internal Server Error",
        message: "There is something went wrong while getting user info",
        status: 500,
      });
    }
    console.log("User info received from SSO", userInfo);
    const { email, name, picture } = userInfo;
    const isUserAlreadyPresent = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -email -country -skills -linkedIn -mobileNumber -github -isVerified -verificationToken -loggedInType -resetPasswordToken"
    );

    if (isUserAlreadyPresent) {
      console.log("User already exists");
      // Generate JWT token for the existing user
      const jwtTokens = jwt.sign(
        { id: isUserAlreadyPresent._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
          issuer: "prds-api",
        }
      );
      console.log("Cookies generated successfully");
      res.cookie("authToken", jwtTokens, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      console.log("User logged in successfully", isUserAlreadyPresent.name);
      // Here toObject is used because when we get the user from DB that is not a plain object
      // its a mongoose document so we need to convert it to plain object for that we use toObject method
      const { _id, ...userWithoutId } = isUserAlreadyPresent.toObject(); // Remove _id from the response
      return res.status(200).json({
        user: userWithoutId,
        title: "User Logged In",
        message: "User has been logged in successfully",
        status: 200,
      });
    }
    // As user logged in for the first time, we will create a new user and store password as hex
    // because we are not using password for SSO users
    const tempPassword = crypto.randomBytes(32).toString("hex");
    const newUser = new User({
      email,
      name,
      picture,
      loggedInType: "GoogleSSO",
      isVerified: true,
      verificationToken: null,
      password: tempPassword, // Store the JWT token as password for SSO users
    });
    await newUser.save();

    console.log("New user created successfully", newUser);
    const jwtToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      issuer: "prds-api",
    });

    console.log("Cookies generated successfully");
    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    console.log("User logged in successfully", newUser.email);
    const { _id, password, ...userWithoutId } = newUser.toObject(); // Remove _id and password from the response
    // Send response to the client
    return res.status(201).json({
      user: userWithoutId,
      title: "User Created",
      message: "User has been created successfully",
      status: 201,
    });
  } catch (error) {
    console.error("Error during SSO sign-in:", error);
    return res.status(500).json({
      title: "Internal Server Error",
      message:
        "There was an error processing your request. Please try again later.",
      status: 500,
    });
  }
}

async function getAccessToken(code, originUrl) {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id:
        "878291443758-klfu3caf4hnvj23vu5i5lgfj93g8gsh9.apps.googleusercontent.com",
      client_secret: process.env.GOOGLE_SECRET,
      redirect_uri: `${originUrl}/oauthify-redirect`,
      grant_type: "authorization_code",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}

async function getUserInfo(token) {
  const response = await axios.get(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
