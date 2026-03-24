const Message = require("../model/message");

const active_users = new Map();
io.on("connection", (socket) => {
  const user = socket.user;

  console.log(`${user} connected`);

  socket.emit("connected", {
    //user details
  });

  socket.on("private-message", async (data) => {
    try {
      const recipientSocket = Array.from(active_users).entries.find(
        ([id, info]) => info.userId === data.toUserId
      )?.[0];

      const message = {
        id: Date.now(),
        from: user._id,
        fromUsername: user.name,
        to: recipientSocket,
        text: data.text,
        timestap: new Date(),
      };

      if (recipientSocket) {
        io.to(recipientSocket).emit("private-message", message);

        socket.emit("message-sent", {
          tempId: data.tempId,
          message,
        });

        await new Message(message).save();
      } else {
        // Recipient is OFFLINE - just save to database
        socket.emit("message-sent", {
          tempId: data.tempId,
          message, //
          delivered: false,
          info: "User is offline. Message will be delivered when they come online.",
        });
      }
    } catch (error) {
      socket.emit("error", {
        message: "Failed to send message",
        error: error.message,
      });
    }
  });

  //get  message when user come online
  socket.on("get-online-message", async (data) => {
    try {
      const offline_message = await Message.find({
        to: user._id,
        delivered: false,
      }).sort({ timestamp: 1 });

      socket.emit("offline-message", offline_message);
      await Message.updateMany(
        { to: user._id, delivered: false },
        { delivered: true }
      );
    } catch (error) {
      console.error("Error fetching offline messages:", error);
    }
  });

  //Get chat history
  socket.on("chat-history", async (data) => {
    try {
      const messages = await Message.find({
        $or: [
          { from: user._id, to: data.withUserId },
          { from: data.withUserId, to: user._id },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(data.limit || 5)
        .skip(data.skip || 0);

      socket.emit("chat-history", {
        withUserId: data.withUserId,
        messages: messages.reverse,
      });
    } catch (error) {
      socket.emit("error", {
        message: "Failed to load chat history",
      });
    }
  });

  //Typing indicator
  socket.on("typing", async (data) => {
    const recipientSocket = Array.from(active_users.entries()).find(
      ([id, info]) => info.userId === data.toUserId
    )?.[0];

    if (recipientSocket) {
      io.to(recipientSocket).emit("user-typing", {
        from: user._id,
        fromUsername: user.name,
      });
    }
  });

  socket.on("stop-typing", async (data) => {
    const recipient_Socket = Array.from(active_users.entries()).find(
      ([id, info]) => info.userId === data.toUserId
    )?.[0];
  });

  if (recipientSocket) {
    io.to(recipientSocket).emit("stopped-typing", {
      from: user._id,
    });
  }
});
