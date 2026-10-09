import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import api from "../../api/axios.jsx";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    let isCurrent = true;

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("This verification link is missing its token.");
        return;
      }

      try {
        const response = await api.post("/auth/verify-email", { token });

        if (isCurrent) {
          setStatus("success");
          setMessage(
            response.data?.message || "Your email has been verified."
          );

          // Remove the one-time token from the visible URL and browser history.
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        if (isCurrent) {
          setStatus("error");
          setMessage(
            isAxiosError(error)
              ? error.response?.data?.message ||
                  "We could not verify this link. It may be invalid or expired."
              : "Something went wrong while verifying your email."
          );
        }
      }
    };

    verify();

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const isVerifying = status === "verifying";

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <section
        className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg"
        aria-live="polite"
      >
        <h1 className="text-2xl font-bold text-gray-800">
          {isVerifying
            ? "Verifying your email"
            : status === "success"
              ? "Email verified"
              : "Verification unsuccessful"}
        </h1>

        <p className="mt-4 text-gray-600">{message}</p>

        {!isVerifying && (
          <div className="mt-6 flex flex-col gap-3">
            {status === "success" ? (
              <Link
                to="/login"
                className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Continue to login
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Go to login
                </Link>
                <Link
                  to="/register"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Create an account
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default VerifyEmail;
