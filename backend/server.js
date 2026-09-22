import "dotenv/config";
import express from "express";
import cors from 'cors'

import connectionDb from "./config/database.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import variantRoutes from "./routes/variantRoutes.js";
import vendorRoutes from './routes/vendorRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
const app = express();

app.use(express.json());
app.use(cors());

connectionDb();

app.use("/api/category", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/variant", variantRoutes);
app.use('/api/vendor',vendorRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/order',orderRoutes)




const PORT =process.env.PORT || 3000 
app.listen(PORT, () => {
  console.log(`Server is on port ${PORT}`);
});