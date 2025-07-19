export function validateRegisterUserIntput(email, password, confirmPassword) {
  if (
    (email == null || email == '') &&
    (password == null || password == '') &&
    (confirmPassword == '' || confirmPassword == null)
  ) {
    return {
      message: "Please fill all the required field",
      error: "Invalid Request",
    };
  }
  if (email == "" || !validateEmail(email) || email == null) {
    return {
      message: "Please enter valid email id",
      error: "Invalid Email Id",
    };
  }
  if (password != confirmPassword) {
    return {
      message: "Password and Confirm Password should be same",
      error: "Incorrect Password",
    };
  }
  if(password == ''|| password == null || confirmPassword == '' || confirmPassword == null){
    return {
      message: "Password/Confirm Password can not be empty.",
      error: "Incorrect Password",
    }
  }
  return {};
}
export function validateEmail(email) {
  var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}