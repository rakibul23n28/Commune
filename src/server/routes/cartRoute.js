import express from "express";
import { pool } from "../config/database.js"; // Assume you have a database connection setup
const router = express.Router();

// Fetch cart items for a specific user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const query = `
        SELECT c.cart_id AS cart_id, c.quantity, 
               p.product_id , p.product_name, p.price, p.product_image,p.description
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = ?
      `;

    const [cartItems] = await pool.execute(query, [userId]);

    if (!cartItems.length) {
      return res.status(200).json({ cart: [] });
    }

    res.status(200).json({ cart: cartItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cart items." });
  }
});

router.post("/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Validate userId
    const [userExists] = await pool.query(
      "SELECT * FROM users WHERE user_id = ?",
      [userId]
    );
    if (userExists.length === 0) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate productId
    const [productExists] = await pool.query(
      "SELECT * FROM products WHERE product_id = ?",
      [productId]
    );
    if (productExists.length === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Check if the product already exists in the cart
    const [existingCartItem] = await pool.query(
      "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );

    if (existingCartItem.length > 0) {
      // Update quantity if product exists
      await pool.query(
        "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
        [quantity, userId, productId]
      );
    } else {
      // Add new product to cart
      await pool.query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [userId, productId, quantity]
      );
    }

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add product to cart" });
  }
});

// Delete a cart item
router.delete("/:cartId", async (req, res) => {
  const { cartId } = req.params;

  try {
    await pool.query("DELETE FROM cart WHERE cart_id = ?", [cartId]);
    res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

// Remove a product from the cart
router.delete("/remove/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const query = "DELETE FROM cart WHERE user_id = ? AND product_id = ?";
    const [result] = await pool.execute(query, [userId, productId]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Product removed from cart." });
    } else {
      return res.status(404).json({ message: "Product not found in cart." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove product from cart." });
  }
});
// Update product quantity in the cart
router.put("/update", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || quantity < 1) {
    return res.status(400).json({ message: "Invalid input data." });
  }

  try {
    const query = `
        UPDATE cart
        SET quantity = ?
        WHERE user_id = ? AND product_id = ?
      `;
    const [result] = await pool.execute(query, [quantity, userId, productId]);

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Cart quantity updated." });
    } else {
      return res.status(404).json({ message: "Product not found in cart." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update cart quantity." });
  }
});

// Place an order
router.post("/create", async (req, res) => {
  const { userId, cart } = req.body;

  if (!userId || !cart || cart.length === 0) {
    return res.status(400).json({ message: "Invalid order data." });
  }

  try {
    // Start a transaction
    await pool.beginTransaction();

    // Create the order
    const orderQuery = `
        INSERT INTO orders (user_id, created_at)
        VALUES (?, NOW())
      `;
    const [orderResult] = await pool.execute(orderQuery, [userId]);
    const orderId = orderResult.insertId;

    // Insert each product into order_items table
    const orderItemsQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `;
    for (const item of cart) {
      await pool.execute(orderItemsQuery, [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
      ]);
    }

    // Clear the cart
    const clearCartQuery = "DELETE FROM cart WHERE user_id = ?";
    await pool.execute(clearCartQuery, [userId]);

    // Commit transaction
    await pool.commit();

    res.status(200).json({ message: "Order placed successfully!" });
  } catch (err) {
    console.error(err);
    await pool.rollback();
    res.status(500).json({ message: "Failed to place order." });
  }
});

export default router;
