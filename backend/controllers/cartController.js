import Cart from "../models/cartSchema.js";
import Variant from "../models/variantSchema.js";
import { getMaxOrderAmount, formatInr } from "../config/limits.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate({
      path: "items.variant",
      populate: {
        path: "product",
      },
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          items: [],
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (err) {
    console.error("Get cart error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


const getCartTotal = async (items) => {
  const variants = await Variant.find(
    { _id: { $in: items.map((i) => i.variant) } },
    "price"
  );
  const priceMap = new Map(variants.map((v) => [v._id.toString(), v.price]));

  return items.reduce(
    (sum, i) => sum + (priceMap.get(i.variant.toString()) || 0) * i.quantity,
    0
  );
};

const limitMessage = () =>
  `Cart total cannot exceed ${formatInr(getMaxOrderAmount())}`;

export const addToCart = async (req, res) => {
  try {
    const { variant, quantity: qty } = req.body; // Yup already made qty a valid integer

    const variantExist = await Variant.findById(variant);
    if (!variantExist) {
      return res.status(404).json({ success: false, message: "Variant does not exist" });
    }

    if (variantExist.stock < qty) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    // No cart yet: check this single line against the limit
    if (!cart) {
      if (variantExist.price * qty > getMaxOrderAmount()) {
        return res.status(400).json({ success: false, message: limitMessage() });
      }

      cart = await Cart.create({
        user: req.user._id,
        items: [{ variant, quantity: qty }],
      });

      return res.status(201).json({
        success: true,
        message: "Item added to cart",
        data: cart,
      });
    }

    const existItem = cart.items.find(
      (item) => item.variant.toString() === variant.toString()
    );

    if (existItem) {
      const newQuantity = existItem.quantity + qty;

      if (newQuantity > MAX_QTY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `You can buy at most ${MAX_QTY_PER_ITEM} of one item`,
        });
      }

      if (newQuantity > variantExist.stock) {
        return res.status(400).json({ success: false, message: "Not enough stock available" });
      }

      existItem.quantity = newQuantity;
    } else {
      cart.items.push({ variant, quantity: qty });
    }

    // Nothing is saved yet, so rejecting here leaves the stored cart unchanged
    const total = await getCartTotal(cart.items);
    if (total > getMaxOrderAmount()) {
      return res.status(400).json({ success: false, message: limitMessage() });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { variant, quantity: qty } = req.body;

    const variantExists = await Variant.findById(variant);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    if (variantExists.stock < qty) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.variant.toString() === variant.toString()
    );
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = qty;

    const total = await getCartTotal(cart.items);
    if (total > getMaxOrderAmount()) {
      return res.status(400).json({ success: false, message: limitMessage() });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const deleteCartItem = async (req, res) => {
  try {
    const { variant } = req.params;

   
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find item
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.variant.toString() === variant.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

  
    cart.items.splice(itemIndex, 1);

    await cart.save();

    // Return populated cart
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.variant",
      populate: {
        path: "product",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    });
  } catch (err) {
    console.error("Delete cart item error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
