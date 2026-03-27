const Message = require("../model/message");
const io = require("socket.io");

const active_users = new Map();
io.on("connection", (socket) => {
  const user = socket.user;

  console.log(`${user} connected`);

  socket.emit("connected", {
    //user details
  });

  // ═══════════════════════════════════════════════
  // JOIN ORDER CHAT ROOM
  // ═══════════════════════════════════════════════

  socket.on("join-order-room", async (data) => {
    // data = { orderId }
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

      // only buyer and farmer of this order can join
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

  // ═══════════════════════════════════════════════
  // SEND ORDER MESSAGE
  // ═══════════════════════════════════════════════

  socket.on("order-message", async (data) => {
    // data = { orderId, text }
    try {
      const roomId = `order_${data.orderId}`;

      const message = {
        from: user._id,
        fromUsername: user.username,
        orderId: data.orderId,
        text: data.text,
        timestamp: new Date(),
        type: "order",
        delivered: true,
      };

      await new Message(message).save();

      // send to both buyer and farmer in the room
      io.to(roomId).emit("order-message", message);
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ═══════════════════════════════════════════════
  // GET ORDER CHAT HISTORY
  // ═══════════════════════════════════════════════

  socket.on("get-order-history", async (data) => {
    // data = { orderId }
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
});
