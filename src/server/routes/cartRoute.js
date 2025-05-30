import express from "express";
import { pool } from "../config/database.js"; // Assume you have a database connection setup
import { validateToken } from "../middleware/auth.js";
const router = express.Router();

router.get("/orders/:userId/:communeId", async (req, res) => {
  const { userId, communeId } = req.params;

  try {
    // Fetch all orders for the user
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // If no orders found, return an empty array
    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    // Fetch order items with product details for the specific commune
    const orderIds = orders.map((order) => order.order_id);
    const [orderItems] = await pool.query(
      `
      SELECT 
        oi.order_id,
        oi.quantity,
        oi.price,
        p.product_id,
        p.product_name,
        p.description,
        p.product_image,
        p.price AS product_price,
        p.commune_id
      FROM order_items oi
      INNER JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id IN (?) AND p.commune_id = ?
      `,
      [orderIds, communeId]
    );

    // Combine orders with their items, filtered by commune
    const ordersWithItems = orders
      .map((order) => ({
        ...order,
        items: orderItems.filter((item) => item.order_id === order.order_id),
      }))
      .filter((order) => order.items.length > 0); // Only include orders with items from the specified commune

    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

router.post("/orders/create", async (req, res) => {
  const { userId, cart } = req.body;

  if (!userId || !cart || cart.length === 0) {
    return res.status(400).json({ message: "Invalid order data." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Calculate total amount
    const totalAmount = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Insert into orders table
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)",
      [userId, totalAmount]
    );
    const orderId = orderResult.insertId;

    // Insert into order_items table
    const orderItems = cart.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [orderItems]
    );

    // Clear the cart
    await connection.query("DELETE FROM cart WHERE user_id = ?", [userId]);

    await connection.commit();

    res.status(201).json({ message: "Order placed successfully." });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Failed to place order." });
  } finally {
    connection.release();
  }
});

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

router.get("/:communeId/:userId", async (req, res) => {
  const { communeId, userId } = req.params;

  try {
    const query = `
        SELECT c.cart_id AS cart_id, c.quantity, 
               p.product_id , p.product_name, p.price, p.product_image,p.description
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = ? AND p.commune_id = ?
      `;

    const [cartItems] = await pool.execute(query, [userId, communeId]);

    if (!cartItems.length) {
      return res.status(200).json({ cart: [] });
    }

    res.status(200).json({ cart: cartItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cart items." });
  }
});

router.post("/add", validateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

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
