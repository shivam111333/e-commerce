
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import { login } from "../../redux/slices/authSlice";
import { toast } from "react-toastify";
import { Form, Formik } from "formik";
import FormField from "../../component/FormField.jsx";
import { loginSchema } from "../../validation/authSchemas.js";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [show, setShow] = useState(false);

  const handleLogin = async (values, { setSubmitting }) => {
    try {
      const response = await api.post("/auth/login", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      const data = response.data;
      dispatch(
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          token: data.token,
        })
      );

      toast.success(data.message || "Login successful");

      if (data.user.role === "admin") {
        navigate("/admin/dashboard/");
      } else if (data.user.role === "vendor") {
        navigate("/vendor/dashboard/");
      } else if (data.user.role === "user") {
        navigate("/");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
          toast.error(
            error.response.data.message ||
              "Please verify your email using the link we sent before logging in."
          );
          return;
        }

        toast.error(
          error.response?.data?.message ||
            "Login failed. Please try again."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            E-Commerce
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your account
          </p>
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={handleLogin}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <FormField
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <FormField
                name="password"
                label="Password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                containerClassName="mb-6"
                renderControl={(fieldProps) => (
                  <div className="flex w-full">
                    <input
                      {...fieldProps}
                      className={`flex-1 min-w-0 border rounded-l-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldProps.className
                      }`}
                    />
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
                )}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>

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
