
import Cart from '../models/cartSchema.js'


export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        message:"Cart is empty"
      });
    }

    return res.status(200).json(cart);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


