
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "./api/axios.jsx";
import { setCart as setReduxCart } from "./redux/slices/cartSlice.js";
import AppRoutes from './routes/AppRoutes';

function AppContent() {
 

    const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated) {
        dispatch(setReduxCart([]));
        return;
      }

      try {
        const response = await api.get("/cart");

        const items = response.data?.data?.items || [];

        dispatch(setReduxCart(items));
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    };

    fetchCart();

  },[isAuthenticated,dispatch])

  return (
    <>
   
     

      <AppRoutes />
    </>
  );
}
export default AppContent