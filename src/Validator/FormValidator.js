import axios from "axios";

export function validateRegisterUserIntput(email, password, confirmPassword) {
  if (
    (email == null || email == "") &&
    (password == null || password == "") &&
    (confirmPassword == "" || confirmPassword == null)
  ) {
    return {
      message: "Please fill all the required field",
      error: "Invalid Request",
      status: 400,
    };
  }
  if (email == "" || !validateEmail(email) || email == null) {
    return {
      message: "Please enter valid email id",
      error: "Invalid Email Id",
      status: 400,
    };
  }
  if (password != confirmPassword) {
    return {
      message: "Password and Confirm Password should be same",
      error: "Incorrect Password",
      status: 400,
    };
  }
  if (
    password == "" ||
    password == null ||
    confirmPassword == "" ||
    confirmPassword == null
  ) {
    return {
      message: "Password/Confirm Password can not be empty.",
      error: "Incorrect Password",
      status: 400,
    };
  }
  return {};
}
export async function validateEmail(email) {

  const option1 = {
    method: "GET",
    url: `${process.env.VALIDECT_RAPIDAPI_URL}`,
    params: {
      email,
    },
    headers: {
      "x-rapidapi-key": `${process.env.VALIDECT_RAPIDAPI_KEY}`,
      "x-rapidapi-host": `${process.env.VALIDECT_RAPIDAPI_HOST}`,
    },
  };

  const options = {
    method: "GET",
    url: `${process.env.EMAIL_CHECKER_RAPIDAPI_URL}`,
    params: {
      email,
    },
    headers: {
      "x-rapidapi-key": `${process.env.EMAIL_CHECKER_RAPIDAPI_KEY}`,
      "x-rapidapi-host": `${process.env.EMAIL_CHECKER_RAPIDAPI_HOST}`,
    },
  };
  // Use the first option for validation
  console.log("Validating email with Validect");
  try {
    const response = await axios.request(option1);
    return response.data;
  } catch (error) {
    if(error.response && error.response.status === 429) {
      console.error("Rate limit exceeded for email validation. Trying the second option.");
    }else {
      console.error("Error validating email:", error);
    }
    // If the first option fails, try the second one
  }
  console.log("Validating email with Email Checker");
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error validating with 2nd email:", error);
    return null;
  }
}
