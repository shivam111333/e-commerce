import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../api/axios.jsx"; // change path if your api file is somewhere else
import { Form, Formik } from "formik";
import FormField from "../../component/FormField.jsx";
import { registerSchema } from "../../validation/authSchemas.js";
import { normalizePhone } from "../../validation/commonSchemas.js";

function Register() {
  const navigate = useNavigate();

  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const response = await api.post("/auth/register", {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalizePhone(values.phone),
        password: values.password,
        role: values.role,
      });

      toast.success(
        response.data?.message ||
          "Registration successful. Check your email to verify your account."
      );
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
      setSubmitting(false);
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

        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            role: "user",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({ isSubmitting }) => (
            <Form noValidate>
              <FormField
                name="name"
                label="Name"
                placeholder="Enter your name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FormField
                name="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                placeholder="Enter your phone number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FormField
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FormField
                name="role"
                label="Register As"
                as="select"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">Customer</option>
                <option value="vendor">Vendor</option>
              </FormField>
              <FormField
                name="password"
                label="Password"
                type={show.password ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter password"
                className="flex-1 min-w-0 border border-gray-300 rounded-l-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                renderControl={(fieldProps) => (
                  <div className="flex w-full">
                    <input {...fieldProps} />
                    <button
                      type="button"
                      aria-label={show.password ? "Hide password" : "Show password"}
                      className="border border-gray-300 border-l-0 bg-gray-100 px-4 rounded-r-lg hover:bg-gray-200"
                      onClick={() =>
                        setShow((prev) => ({ ...prev, password: !prev.password }))
                      }
                    >
                      {show.password ? (
                        <FaEyeSlash className="w-5 h-5" />
                      ) : (
                        <FaEye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              />
             
              <FormField
                name="confirmPassword"
                label="Confirm Password"
                type={show.confirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                containerClassName="mb-6"
                className="flex-1 min-w-0 border border-gray-300 rounded-l-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                renderControl={(fieldProps) => (
                  <div className="flex w-full">
                    <input {...fieldProps} />
                    <button
                      type="button"
                      aria-label={
                        show.confirmPassword ? "Hide password" : "Show password"
                      }
                      className="border border-gray-300 border-l-0 bg-gray-100 px-4 rounded-r-lg hover:bg-gray-200"
                      onClick={() =>
                        setShow((prev) => ({
                          ...prev,
                          confirmPassword: !prev.confirmPassword,
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
                )}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </Form>
          )}
        </Formik>

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
