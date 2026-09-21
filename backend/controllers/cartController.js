import Cart from "../models/cartSchema.js";
import Variant from "../models/variantScehma.js";

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

export const addToCart = async (req, res) => {
  try {
    const { variant, quantity } = req.body;

    const qty = Number(quantity);

    // Validate request
    if (!variant || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid variant and quantity are required",
      });
    }

    // Check variant exists
    const variantExist = await Variant.findById(variant);

    if (!variantExist) {
      return res.status(404).json({
        success: false,
        message: "Variant does not exist",
      });
    }

    // Check stock for requested quantity
    if (variantExist.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    // Find user's cart
    let cart = await Cart.findOne({
      user: req.user._id,
    });

    // If cart does not exist, create it
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [
          {
            variant,
            quantity: qty,
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Item added to cart",
        data: cart,
      });
    }

    // Check whether this variant already exists in cart
    const existItem = cart.items.find(
      (item) => item.variant.toString() === variant.toString()
    );

    // Variant already exists
    if (existItem) {
      const newQuantity = existItem.quantity + qty;

      // Check total quantity against stock
      if (newQuantity > variantExist.stock) {
        return res.status(400).json({
          success: false,
          message: "Not enough stock available",
        });
      }

      existItem.quantity = newQuantity;
    } 
    
    // Variant does not exist in cart
    else {
      cart.items.push({
        variant,
        quantity: qty,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (err) {
    console.error("Add to cart error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { variant, quantity } = req.body;
     const qty = Number(quantity);

    if (!variant || !Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid variant and quantity are required",
      });
    }

    const variantExists = await Variant.findById(variant);

    if (!variantExists) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    if (variantExists.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.variant.toString() === variant.toString()
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    item.quantity = qty;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: cart,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const deleteCartItem = async (req, res) => {
  try {
    const { variant } = req.params;

    // Validate variant ID
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Variant ID is required",
      });
    }

    // Find user's cart
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

    // Remove item
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