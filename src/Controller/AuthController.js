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
import { publishJobEvent } from "../SQSClient/queuePublisher.js";
import e from "express";

dotenv.config();

export async function registerUser(req, res) {
  const { email, password, confirmPassword } = req.body;
  const validateIntput = validateRegisterUserIntput(
    email.trim(),
    password.trim(),
    confirmPassword.trim(),
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
    const token = crypto.randomBytes(32).toString("hex");
    newUser.verificationToken = token;
    await newUser.save();

    console.log("User saved in DB, Now sending mail for verification");

    sendEmailForFirstTimeVerification(newUser, "verification").catch(
      (error) => {
        console.log("There is something went wrong from email service", error);
      },
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
      return res.status(404).json({
        message:
          "Verification link is invalid. Please try again requesting Verification link using forgot password",
        title: "Invalid Verification Link",
        status: 404,
      });
    }
    if (isTokenThere.isVerified) {
      return res.status(200).json({
        message: "Your email is already verified!",
        title: "Already Verified",
        status: 200,
      });
    }
    isTokenThere.isVerified = true;
    isTokenThere.verificationToken = null; // Clear the verification token after successful verification
    await isTokenThere.save();
    return res.status(200).json({
      message: "Your email has been successfully verified!",
      title: "Verification Successful",
      status: 200,
    });
  } catch (error) {
    console.log("Something went wrong from verifyUser method", error);
    return res.status(500).json({
      message:
        "There was a problem while verifying your account. Please try again later.",
      title: "Internal Server Error",
      status: 500,
    });
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
    "-__v -createdAt -updatedAt -role -country -skills -linkedIn -mobileNumber -github -verificationToken -loggedInType -resetPasswordToken",
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
  res.clearCookie("authToken");
  if (!isValidPassword) {
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
  const { _id, password: _, ...userWithoutId } = isValidUser.toObject(); // Remove _id and password from the response

  return res.status(200).json({
    user: userWithoutId,
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
  const type = req.query.type;
  //this is use for redirecting back to the origin URL after successful SSO login
  let originUrl = req.get("origin");

  if (!code) {
    return res.status(400).json({
      title: "Invalid Request",
      message: "Please pass the token in query params",
      status: 400,
    });
  }
  console.log(type);
  const loginType = type?.trim().toLowerCase();
  if (!type && (loginType != "google" || loginType != "github")) {
    return res.status(400).json({
      title: "Bad Request",
      message: "Please pass the correct sso type query params",
      status: 400,
    });
  }

  if (loginType == "google") {
    return loginWithGoogle(code, res);
  }
  console.log("code received from github sso", code.trim());
  const token = await getAccessTokenForGithub(code.trim(), originUrl, res);

  console.log("Token received from github");
  try {
    const userInfo = await getUserInfoFromGithub(token);
    if (!userInfo) {
      return res.status(500).json({
        title: "Internal Server Error",
        message: "There is something went wrong while getting user info",
        status: 500,
      });
    }
    console.log("User info received from github SSO", userInfo);
    const { email, name, id, login, avatar_url, html_url } = userInfo;
    const userSearch = User.findOne({
      $or: [
        {
          githubId: id,
          email,
        },
      ],
    }).select(
      "-password -__v -createdAt -updatedAt -role -email -country -skills -linkedIn -mobileNumber -github -isVerified -verificationToken -loggedInType -resetPasswordToken",
    );

    if (!userSearch) {
      console.log("User already exists in db from github sso");
      // Generate JWT token for the existing user
      const jwtTokens = jwt.sign(
        { id: isUserAlreadyPresent._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
          issuer: "prds-api",
        },
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
    const tempPassword = await argon.hash(
      crypto.randomBytes(32).toString("hex"),
    );
    const newUser = new User({
      email: email == null ? "NA" : email,
      name,
      picture: avatar_url,
      githubId: id,
      github: html_url,
      userId: login,
      loggedInType: "GithubSSO",
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
    console.log("User logged in successfully", newUser.name);
    const {
      _id,
      password,
      githubId,
      isVerified,
      linkedIn,
      mobileNumber,
      verificationToken,
      _v,
      country,
      createdAt,
      skills,
      updatedAt,
      loggedInType,
      github,
      ...userWithoutId
    } = newUser.toObject(); // Remove _id and password from the response
    // Send response to the client
    return res.status(201).json({
      user: userWithoutId,
      title: "User Created",
      message: "User has been created successfully",
      status: 201,
    });
  } catch (error) {
    console.error("Error during SSO github sign-in:", error);
    return res.status(500).json({
      title: "Internal Server Error",
      message:
        "There was an error processing your request. Please try again later.",
      status: 500,
    });
  }
}
async function getUserInfoFromGithub(token) {
  let response;
  try {
    response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.log("something went wrong while getting user info from google");
  }
  console.log(response);
  return response.data;
}
async function getAccessTokenForGithub(code, originUrl, res) {
  try {
    console.log("url", originUrl + "/login");
    originUrl = originUrl + "/login";

    const token = await axios.post(
      "https://github.com/login/oauth/access_token",
      new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_SECRET,
        code: code,
        redirect_uri: originUrl,
      }),
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    // console.log(token);
    return token.data.access_token;
  } catch (error) {
    console.log("error", error);
    if (error.response.status == 400) {
      return res.status(400).json({
        status: 400,
        title: "Bad Request",
        message: "Invalid Grant request",
      });
    } else {
      return res.status(500).json({
        status: 500,
        title: "Something Went wrong",
        message: "Please try after sometime.",
      });
    }
  }
}
async function loginWithGoogle(code, res) {
  console.log("Code received from google SSO", code);
  const token = await getAccessToken(code, res);
  console.log("Access token received from google SSO");
  const userInfo = await getUserInfo(token);
  try {
    if (!userInfo) {
      return res.status(500).json({
        title: "Internal Server Error",
        message: "There is something went wrong while getting user info",
        status: 500,
      });
    }
    console.log("User info received from google SSO", userInfo);
    const { email, name, picture } = userInfo;
    const isUserAlreadyPresent = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -email -country -skills -linkedIn -mobileNumber -github -isVerified -verificationToken -loggedInType -resetPasswordToken",
    );

    if (isUserAlreadyPresent) {
      console.log("User already in db exists from google sso");
      // Generate JWT token for the existing user
      const jwtTokens = jwt.sign(
        { id: isUserAlreadyPresent._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
          issuer: "prds-api",
        },
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
    const tempPassword = await argon.hash(
      crypto.randomBytes(32).toString("hex"),
    );
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

async function getAccessToken(code, res) {
  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response.data.access_token;
  } catch (error) {
    console.log("error", error);
    if (error.response.status == 400) {
      return res.status(400).json({
        status: 400,
        title: "Bad Request",
        message: "Invalid Grant request",
      });
    } else {
      return res.status(500).json({
        status: 500,
        title: "Something Went wrong",
        message: "Please try after sometime.",
      });
    }
  }
}

async function getUserInfo(token) {
  let response;
  try {
    response = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (error) {
    console.log("something went wrong while getting user info from google");
  }
  return response.data;
}
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User with this email does not exist.",
        title: "User Not Found",
        status: 404,
      });
    }
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
      issuer: "prds-api",
    });
    user.resetPasswordToken = resetToken;
    await user.save();
    console.log(
      "Generated verification token for password reset and saved in db",
    );
    await publishJobEvent({
      eventType: "PASSWORD_RESET_REQUESTED",
      token: resetToken,
      email: user.email,
      name: user.name,
    });
    console.log("Published PASSWORD_RESET_REQUESTED event to SQS");
    // Here you would typically generate a reset token and send an email
    return res.status(200).json({
      message: "Password reset link has been sent to your email.",
      title: "Reset Link Sent",
      status: 200,
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json({
      message: "Internal server error while processing forgot password.",
      title: "Server Error",
      status: 500,
    });
  }
};
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required.",
        title: "Bad Request",
        status: 400,
      });
    }

    const { id, exp, iss } = jwt.verify(token, process.env.JWT_SECRET);
    if (iss !== process.env.ISSUER || exp < Math.floor(new Date() / 1000)) {
      return res.status(401).json({
        message: "Invalid or expired password reset url. Please try again request from requesting password.",
        title: "Invalid Token",
        status: 401,
      });
    }
    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset link.",
        title: "Invalid Token",
        status: 400,
      });
    }
    user.password = await argon.hash(newPassword);
    user.resetPasswordToken = null;
    await user.save();
    return res.status(200).json({
      message: "Password has been reset successfully.",
      title: "Password Reset Successful",
      status: 200,
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    return res.status(500).json({
      message: "Internal server error while resetting password.",
      title: "Server Error",
      status: 500,
    });
  }
};
