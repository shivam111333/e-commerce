import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios.jsx"; // change path if your api file is somewhere else

function Register() {
  const navigate = useNavigate();

  // -----------------------------
  // Form fields
  // -----------------------------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");

  // -----------------------------
  // UI states
  // -----------------------------
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  // -----------------------------
  // Email validation
  // -----------------------------
  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  };

  // -----------------------------
  // Form validation
  // -----------------------------
  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "",
    };

    let isValid = true;

    // Name
    if (!name.trim()) {
      newErrors.name = "Please fill this field.";
      isValid = false;
    }

    // Email
    if (!email.trim()) {
      newErrors.email = "Please fill this field.";
      isValid = false;
    } else if (!isValidEmail(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // Phone
    if (!phone.trim()) {
      newErrors.phone = "Please fill this field.";
      isValid = false;
    } else if (!/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid 10-digit number.";
      isValid = false;
    }

    // Role
    if (!role) {
      newErrors.role = "Please select a role.";
      isValid = false;
    }

    // Password
    if (!password) {
      newErrors.password = "Please fill this field.";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      isValid = false;
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please fill this field.";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  // -----------------------------
  // Clear field error
  // -----------------------------
  const clearFieldError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // -----------------------------
  // Register
  // -----------------------------
  const handleRegister = async (e) => {
    e.preventDefault();

    setSubmitted(true);

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
      });

      toast.success(
        response.data?.message || "Registration successful."
      );

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setRole("user");

      setErrors({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
      });

      setSubmitted(false);

      // Go to login page
      navigate("/login");
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Create Account
          </h1>

          <p className="text-gray-500 mt-2">
            Create your e-commerce account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} noValidate>

          {/* Name */}
          <div className="mb-5">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              placeholder="Enter your name"
              className={`w-full border rounded-lg px-4 py-3 outline-none ${
                submitted && errors.name
                  ? "border-red-500"
                  : "border-gray-300"
              } focus:ring-2 focus:ring-blue-500`}
            />

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError("phone");
              }}
              placeholder="Enter your phone number"
              className={`w-full border rounded-lg px-4 py-3 outline-none ${
                submitted && errors.phone
                  ? "border-red-500"
                  : "border-gray-300"
              } focus:ring-2 focus:ring-blue-500`}
            />

            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
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
                clearFieldError("email");
              }}
              placeholder="Enter your email"
              className={`w-full border rounded-lg px-4 py-3 outline-none ${
                submitted && errors.email
                  ? "border-red-500"
                  : "border-gray-300"
              } focus:ring-2 focus:ring-blue-500`}
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="mb-5">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Register As
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                clearFieldError("role");
              }}
              className={`w-full border rounded-lg px-4 py-3 outline-none ${
                submitted && errors.role
                  ? "border-red-500"
                  : "border-gray-300"
              } focus:ring-2 focus:ring-blue-500`}
            >
              <option value="user">Customer</option>
              <option value="vendor">Vendor</option>
            </select>

            {errors.role && (
              <p className="text-red-500 text-sm mt-1">
                {errors.role}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="flex w-full">
              <input
                id="password"
                type={show.password ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                placeholder="Enter password"
                className={`flex-1 min-w-0 border rounded-l-lg px-4 py-3 outline-none ${
                  submitted && errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500`}
              />

              <button
                type="button"
                aria-label={
                  show.password
                    ? "Hide password"
                    : "Show password"
                }
                className="border border-gray-300 border-l-0 bg-gray-100 px-4 rounded-r-lg hover:bg-gray-200"
                onClick={() =>
                  setShow((prev) => ({
                    ...prev,
                    password: !prev.password,
                  }))
                }
              >
                {show.password ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors.password ? (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password
            </label>

            <div className="flex w-full">
              <input
                id="confirmPassword"
                type={
                  show.confirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                placeholder="Confirm your password"
                className={`flex-1 min-w-0 border rounded-l-lg px-4 py-3 outline-none ${
                  submitted && errors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-blue-500`}
              />

              <button
                type="button"
                aria-label={
                  show.confirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="border border-gray-300 border-l-0 bg-gray-100 px-4 rounded-r-lg hover:bg-gray-200"
                onClick={() =>
                  setShow((prev) => ({
                    ...prev,
                    confirmPassword:
                      !prev.confirmPassword,
                  }))
                }
              >
                {show.confirmPassword ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Already have an account?{" "}

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;

