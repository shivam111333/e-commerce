
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import {login} from '../../redux/slices/authSlice'

import { toast } from "react-toastify";

// Email validation
const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch=useDispatch()
 

  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password visibility
  const [show, setShow] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setSubmitted(true);
    setEmailError("");

    // Remove spaces from beginning/end
    const trimmedEmail = email.trim();

    // =========================
    // EMAIL VALIDATION
    // =========================

    if (!trimmedEmail) {
      setEmailError("Please fill this field.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    // =========================
    // PASSWORD VALIDATION
    // =========================

    if (!password) {
      return;
    }

    // =========================
    // API LOGIN
    // =========================

    try {
      setLoading(true);

      // Convert email to lowercase
      const normalizedEmail = trimmedEmail.toLowerCase();

      const response = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      const data = response.data;
  

      /*
        Expected backend response:

        {
          success: true,
          message: "Login successful",
          token: "...",
          user: {
            id: "...",
            name: "...",
            email: "...",
            role: "vendor"
          }
        }

      */
     dispatch(login({
         id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
     token: data.token
     }))
          
  
     
      toast.success(data.message || "Login successful");
      
        
      //  console.log(data.user.role)
      // REDIRECT BASED ON ROLE (FIXED)
      // =========================

      if (data.user.role === "admin") {
        navigate("/admin/dashboard/");
      } else if (data.user.role === "vendor") {
        navigate("/vendor/dashboard/");
      } else if (data.user.role === "user") {
        navigate("/");
      } else {
        navigate("/"); // Fallback for any unknown roles
      }


    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Login failed. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            E-Commerce
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>

          {/* ================= EMAIL ================= */}

          <div className="mb-5">

            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (emailError) {
                  setEmailError("");
                }
              }}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Email Error */}
            {emailError && (
              <p className="text-red-500 text-sm mt-1">
                {emailError}
              </p>
            )}

          </div>

          {/* ================= PASSWORD ================= */}

          <div className="mb-6">

            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="flex w-full">

              {/* Password Input */}
              <input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder="Enter your password"
                className="flex-1 min-w-0 border border-gray-300 rounded-l-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Eye Button */}
              <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                className="border border-gray-300 border-l-0 bg-gray-100 px-4 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>

            </div>

            {/* Password Error */}
            {submitted && !password && (
              <p className="text-red-500 text-sm mt-1">
                Please fill this field.
              </p>
            )}

          </div>

          {/* ================= LOGIN BUTTON ================= */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* ================= REGISTER ================= */}

        <div className="text-center mt-6">

          <p className="text-gray-500 text-sm">

            Don't have an account?{" "}

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register
            </button>

          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;

