// components/ChatBox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { connect_socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types";
import io from "socket.io-client";

interface ChatBoxProps {
  order_id: string;
}
declare global {
  interface Window {
    typing_timer: ReturnType<typeof setTimeout> | undefined;
  }
}

export default function ChatBox({ order_id }: ChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [typing, setTyping] = useState<string | null>(null);

  type Socket = ReturnType<typeof io>;
  const socket = connect_socket() as Socket;
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-order-room", { orderId: order_id });
    socket.emit("get-order-history", { orderId: order_id });

    socket.on("order-history", (data: { messages: Message[] }) => {
      setMessages(data.messages);
    });

    socket.on("order-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-typing", (data: { fromUsername: string }) => {
      setTyping(`${data.fromUsername} is typing...`);
    });

    socket.on("user-stop-typing", () => {
      setTyping(null);
    });

    return () => {
      socket.off("order-history");
      socket.off("order-message");
      socket.off("user-typing");
      socket.off("user-stop-typing");
    };
  }, [order_id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send_message = (): void => {
    if (!text.trim()) return;
    socket.emit("order-message", { orderId: order_id, text });
    socket.emit("stop-typing", { orderId: order_id });
    setText("");
  };

  const handle_typing = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setText(e.target.value);
    socket.emit("typing", { orderId: order_id });
    clearTimeout(window.typing_timer);
    window.typing_timer = setTimeout(() => {
      socket.emit("stop-typing", { orderId: order_id });
    }, 1500);
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg overflow-hidden">
      <div className="bg-green-700 text-white text-sm px-4 py-2 font-medium">
        Order Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-gray-50">
        {messages.map((msg, i) => {
          const is_mine = msg.from?.toString() === user?._id?.toString();
          return (
            <div
              key={i}
              className={`flex ${is_mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  is_mine
                    ? "bg-green-700 text-white"
                    : "bg-white border text-gray-800"
                }`}
              >
                {!is_mine && (
                  <p className="text-xs font-medium text-green-700 mb-1">
                    {msg.fromUsername}
                  </p>
                )}
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    is_mine ? "text-green-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {typing && <p className="text-xs text-gray-400 italic">{typing}</p>}
        <div ref={bottom} />
      </div>

      <div className="flex gap-2 p-3 border-t bg-white">
        <input
          value={text}
          onChange={handle_typing}
          onKeyDown={(e) => e.key === "Enter" && send_message()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={send_message}
          className="bg-green-700 text-white px-4 py-2 rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
