// config/socket.js
const Message = require("../model/message");
const Order = require("../model/order");
const socketAuth = require("../middleware/socketAuth");

const active_users = new Map();

module.exports = (io) => {
  // authenticate every socket connection
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.user;

    console.log(`${user.username} connected`);

    // store user
    active_users.set(socket.id, {
      userId: user._id.toString(),
      username: user.username,
      socketId: socket.id,
    });

    // confirm connection to this user
    socket.emit("connected", {
      userId: user._id,
      username: user.username,
    });

    // JOIN ORDER CHAT ROOM

    socket.on("join-order-room", async (data) => {
      try {
        const order = await Order.findById(data.orderId).populate(
          "buyer farmer",
          "_id"
        );

        if (!order) {
          return socket.emit("error", { message: "Order not found" });
        }

        const isBuyer = order.buyer._id.toString() === user._id.toString();
        const isFarmer = order.farmer._id.toString() === user._id.toString();

        if (!isBuyer && !isFarmer) {
          return socket.emit("error", {
            message: "Not authorized for this order chat",
          });
        }

        const roomId = `order_${data.orderId}`;
        socket.join(roomId);

        socket.emit("joined-order-room", { orderId: data.orderId, roomId });
      } catch (error) {
        socket.emit("error", { message: "Could not join order room" });
      }
    });

    // SEND ORDER MESSAGE

    socket.on("order-message", async (data) => {
      try {
        const roomId = `order_${data.orderId}`;

        const message = new Message({
          from: user._id,
          fromUsername: user.username,
          orderId: data.orderId,
          text: data.text,
          type: "order",
          delivered: true,
        });

        await message.save();

        // emit to everyone in the room including sender
        io.to(roomId).emit("order-message", {
          _id: message._id,
          from: user._id,
          fromUsername: user.username,
          orderId: data.orderId,
          text: data.text,
          timestamp: message.timestamp,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // TYPING INDICATOR

    socket.on("typing", (data) => {
      const roomId = `order_${data.orderId}`;
      socket.to(roomId).emit("user-typing", {
        fromUsername: user.username,
      });
    });

    socket.on("stop-typing", (data) => {
      const roomId = `order_${data.orderId}`;
      socket.to(roomId).emit("user-stop-typing", {
        fromUsername: user.username,
      });
    });

    // GET ORDER CHAT HISTORY

    socket.on("get-order-history", async (data) => {
      try {
        const messages = await Message.find({
          orderId: data.orderId,
          type: "order",
        }).sort({ timestamp: 1 });

        socket.emit("order-history", { orderId: data.orderId, messages });
      } catch (error) {
        socket.emit("error", { message: "Failed to load order chat" });
      }
    });

    // DISCONNECT

    socket.on("disconnect", () => {
      console.log(`${user.username} disconnected`);
      active_users.delete(socket.id);
    });
  });
};
