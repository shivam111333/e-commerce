import axios from "axios";
// import { toast } from "react-toastify";
import { persistor, store } from "../redux/store.js";
import { logout } from "../redux/slices/authSlice.js";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL,
});

let isHandlingExpiredSession = false;

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth?.user?.token;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const token = store.getState().auth?.user?.token;
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      token &&
      !isLoginRequest &&
      !isHandlingExpiredSession
    ) {
      isHandlingExpiredSession = true;
      store.dispatch(logout());
      sessionStorage.setItem("sessionExpired", "true");
      await persistor.flush();
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default api;
