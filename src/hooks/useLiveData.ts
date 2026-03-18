import { useEffect, useState } from "react";

// Singleton to avoid creating multiple EventSource connections
let eventSource: EventSource | null = null;
let listeners: Array<(channel: string) => void> = [];

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

const connect = () => {
  if (eventSource) return;
  eventSource = new EventSource(`${API_BASE}/api/events`);
  
  eventSource.addEventListener("data-change", (event) => {
    const channel = event.data;
    listeners.forEach((listener) => listener(channel));
  });

  // Reconnect logic is mostly built into EventSource, but we handle errors
  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
    // Automatically reconnect after 5 seconds to avoid spamming the server
    setTimeout(connect, 5000);
  };
};

/**
 * Hook to listen for data changes from the backend.
 * @param channels Array of channel names to listen for (e.g. ["products", "categories"])
 * @returns A timestamp that updates whenever a relevant change occurs. Use this in a useEffect dependency array to trigger a reload.
 */
export const useLiveData = (channels: string[]) => {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!eventSource) {
      connect();
    }

    const listener = (channel: string) => {
      if (channels.includes(channel) || channels.includes("*")) {
        setLastUpdate(Date.now());
      }
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
      // Clean up connection if no components are listening anymore
      if (listeners.length === 0 && eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }, [channels]);

  return lastUpdate;
};
