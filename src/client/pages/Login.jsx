import { useState } from "react";
import Layout from "../components/Layout";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { setUser, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");

    const { success, message } = await login(email, password);
    if (success) {
      navigate("/");
    } else {
      setErrorMessage(message);
    }
    setIsSubmitting(false);
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const decodedToken = JSON.parse(
      atob(credentialResponse.credential.split(".")[1])
    );
    const {
      given_name: firstName,
      family_name: lastName,
      email,
      picture,
      sub: socialId,
    } = decodedToken;
    const username = email.split("@")[0];

    try {
      const response = await axios.post("/api/auth/social-register", {
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        picture,
        social_id: socialId,
      });

      if (response.data.success) {
        const updatedUserWithToken = {
          ...response.data.user,
          token: response.data.token,
        };
        setUser(updatedUserWithToken);
        localStorage.setItem("user", JSON.stringify(updatedUserWithToken));
        navigate("/");
      } else {
        console.error(
          "Error logging in or registering:",
          response.data.message
        );
      }
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const handleFacebookLogin = async (response) => {
    if (response.accessToken) {
      const { name, email, id: socialId, picture } = response;
      const [firstName, ...lastNameArray] = name.split(" ");
      const lastName = lastNameArray.join(" ");
      const username = email.split("@")[0];

      try {
        const apiResponse = await axios.post("/api/auth/social-register", {
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          picture: picture.data.url,
          social_id: socialId,
        });

        if (apiResponse.data.success) {
          const updatedUserWithToken = {
            ...apiResponse.data.user,
            token: apiResponse.data.token,
          };

          setUser(updatedUserWithToken);
          localStorage.setItem("user", JSON.stringify(updatedUserWithToken));
          navigate("/");
        } else {
          console.error(
            "Error logging in or registering:",
            apiResponse.data.message
          );
        }
      } catch (error) {
        alert(error.response?.data?.message);
      }
    } else {
      console.log("Facebook Login Failed");
    }
  };

  const renderInputField = (id, label, value, setValue, type = "text") => (
    <div className="relative mb-4">
      <input
        type={type}
        id={id}
        className="peer appearance-none border-b-2 border-red-200 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-green-500 placeholder-transparent"
        placeholder={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <label
        htmlFor={id}
        className="absolute left-0 -top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3 peer-focus:text-gray-500 peer-focus:text-sm"
      >
        {label}
      </label>
    </div>
  );

  return (
    <Layout>
      <div className="flex h-screen w-full">
        <div className="w-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex flex-col justify-center items-center p-10">
          <img
            src="https://via.placeholder.com/300"
            alt="Placeholder"
            className="mb-6 w-48 h-48 object-cover rounded-full"
          />
          <p className="text-lg font-semibold mb-4">
            "Your journey starts here."
          </p>
          <div className="flex flex-col space-y-4">
            <FacebookLogin
              appId="2035754323574938"
              fields="name,email,picture,first_name,last_name"
              callback={handleFacebookLogin}
              icon="fa-facebook"
              textButton="Login with Facebook"
              cssClass="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            />
            <GoogleOAuthProvider clientId="31347194601-9iu4aee0gc6k0oab2qp6k69m6omr16gr.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.log("Google Login Failed")}
              />
            </GoogleOAuthProvider>
          </div>
        </div>

        <div className="w-1/2 bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-center text-green-800">
              Login
            </h2>
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <p className="text-red-500 mb-4">{errorMessage}</p>
              )}
              {renderInputField("email", "Email", email, setEmail, "email")}
              <div className="relative mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="peer appearance-none border-b-2 border-red-200 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:border-green-500 placeholder-transparent"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 -top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3 peer-focus:text-gray-500 peer-focus:text-sm"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-600"
                >
                  {showPassword ? (
                    <i className="fas fa-eye-slash"></i>
                  ) : (
                    <i className="fas fa-eye"></i>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-blue-500 w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Login"}
                </button>
              </div>
            </form>
            <div className="text-center mt-4">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="underline hover:text-green-500">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
