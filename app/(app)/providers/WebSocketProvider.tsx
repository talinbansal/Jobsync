"use client";

import { createContext, ReactNode, useEffect, useState, useRef } from "react";

type Notification = {
  status: string;
  jobId: string;
  jobName: string;
};

type WebSocketContextType = {
  notifs: Notification[];
  unread: number;
  setUnread: React.Dispatch<React.SetStateAction<number>>;
};

type Props = {
  children: ReactNode;
};

export const WebSocketContext = createContext<WebSocketContextType>({
  notifs: [],
  unread: 0,
  setUnread: () => {},
});

export default function WebSocketProvider({ children }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/fetch_applied_jobs_status",
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          if (!res.ok) {
            const errorMessage = await res.json();

            throw new Error(errorMessage.error);
          }
        }

        const data = await res.json();

        setNotifs(data.job_statuses ?? []); // To avoid making it null
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const ws = new WebSocket("ws://localhost:8080/ws");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setNotifs((prev) => {
          const existingIndex = prev.findIndex(
            (notif) => notif.jobId === data.jobId,
          );

          if (existingIndex !== -1) {
            const updated = [...prev]; // creates a new array with same data
            updated[existingIndex] = data; // Now we can mutate the copy
            return updated; // If jobId already exists then we update that
          }

          return [...prev, data]; // when jobId doesnt already exist we just append the new data
        });
        setUnread((n) => n + 1);

        console.log(`Received: ${JSON.stringify(data)}`);
      } catch (err) {
        console.error("Invalid WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      socketRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  console.log("Provider unread:", unread);

  return (
    <WebSocketContext.Provider value={{ notifs, unread, setUnread }}>
      {children}
    </WebSocketContext.Provider>
  );
}
