"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushSettings() {
  const [status, setStatus] = useState<"idle" | "working" | "enabled" | "error">("idle");
  const [message, setMessage] = useState("");

  async function enable() {
    setStatus("working");
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push isn't configured yet on the server.");

      const isStandalonePwa = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error(
          isStandalonePwa || !/iPhone|iPad|iPod/.test(navigator.userAgent)
            ? "This browser doesn't support push notifications."
            : "iPhone only supports push after you add this to your Home Screen: tap the Share icon, then \"Add to Home Screen,\" then open it from there and try again."
        );
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        throw new Error("Notifications are blocked for this site — check your browser's site settings to allow them, then try again.");
      }
      if (permission !== "granted") throw new Error("Notification permission wasn't granted.");

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("enabled");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function sendTest() {
    setMessage("");
    const res = await fetch("/api/push/test", { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? "Test push sent — check for the notification." : data.error);
  }

  return (
    <div className="rounded-xl border border-border bg-paper-raised p-4">
      <h2 className="font-display font-medium text-ink">Notifications</h2>
      <p className="mt-1 text-sm text-ink-muted">Turn these on to get notified about new entries and reminders.</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={enable}
          disabled={status === "working"}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper-raised transition hover:bg-accent-dark disabled:opacity-50"
        >
          {status === "enabled" ? "Enabled ✓" : status === "working" ? "Enabling…" : "Enable notifications"}
        </button>
        <button
          onClick={sendTest}
          className="rounded-full border border-border px-4 py-2 text-sm text-ink-muted hover:border-accent hover:text-accent-dark"
        >
          Send test push
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-ink-muted">{message}</p>}
    </div>
  );
}
