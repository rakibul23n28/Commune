import { Server } from "socket.io";
import jwt from "jsonwebtoken"; // Assuming you are using JWT for authentication
import { pool } from "../config/database.js";

let io;

export const saveMessageToDatabase = async (messageData) => {
  const { senderId, receiverId, message_text, chatType } = messageData;

  try {
    if (chatType === "individual") {
      let chatIdToUse = receiverId;

      const [existingChat] = await pool.query(
        `SELECT chat_id
         FROM individual_chats
         WHERE (user_id_1 = ? AND user_id_2 = ?)
         OR (user_id_1 = ? AND user_id_2 = ?)`,
        [senderId, receiverId, receiverId, senderId]
      );

      if (existingChat.length > 0) {
        chatIdToUse = existingChat[0].chat_id;
      } else {
        const [result] = await pool.query(
          `INSERT INTO individual_chats (user_id_1, user_id_2)
           VALUES (?, ?)`,
          [senderId, receiverId]
        );
        chatIdToUse = result.insertId;
      }

      await pool.query(
        `INSERT INTO individual_chat_messages (individual_chat_id, sender_id, message_text)
         VALUES (?, ?, ?)`,
        [chatIdToUse, senderId, message_text]
      );
    } else if (chatType === "commune") {
      const chat_id = receiverId;
      await pool.query(
        `INSERT INTO messages (chat_id, sender_id, message_text)
         VALUES (?, ?, ?)`,
        [chat_id, senderId, message_text]
      );
    } else {
      throw new Error("Invalid chat type");
    }
  } catch (error) {
    console.error("Error saving message to the database:", error);
    throw error;
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error"));
      }
      socket.user = decoded; // Store the user data in socket
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("sendMessage", async (messageData) => {
      const { senderId, receiverId, chatType } = messageData;

      try {
        await saveMessageToDatabase(messageData);

        let roomId = "";

        if (chatType === "commune") {
          console.log(` commune private-${receiverId}`);
          roomId = `private-${receiverId}`;

          io.to(`private-${receiverId}`).emit("receiveMessage", messageData);
        } else {
          roomId = `private-${Math.min(senderId, receiverId)}-${Math.max(
            senderId,
            receiverId
          )}`;
          console.log(`individual ${roomId}`);
          io.to(roomId).emit("receiveMessage", messageData);
        }
        io.to(roomId).emit("newMessage", messageData);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("errorMessage", { error: "Failed to send message" });
      }
    });

    socket.on("joinPrivateRoom", ({ senderId, receiverId, chatType }) => {
      let roomId = "";
      if (chatType === "commune") {
        roomId = `private-${receiverId}`;
        console.log("commune", roomId);
      } else {
        roomId = `private-${Math.min(senderId, receiverId)}-${Math.max(
          senderId,
          receiverId
        )}`;
        console.log("individual", roomId);
      }

      socket.join(roomId);

      console.log(`User ${senderId} joined private room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export const getSocketIo = () => io;
