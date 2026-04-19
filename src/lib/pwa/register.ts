/**
 * Service-worker registration + push-subscription helpers.
 *
 * Call `registerServiceWorker()` from a client-side layout effect, and
 * `subscribeToPush()` when the user opts in to visibility-drop alerts.
 */

export interface PushSubscriptionResult {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    // eslint-ignore-console — this is the one spot we log at console level
    // because the logger module can't load before the SW is ready.
    console.warn("SW registration failed", err);
    return null;
  }
}

export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscriptionResult | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
  });

  const p256dh = arrayBufferToBase64(
    subscription.getKey("p256dh") as ArrayBuffer | null,
  );
  const auth = arrayBufferToBase64(
    subscription.getKey("auth") as ArrayBuffer | null,
  );

  if (!p256dh || !auth) return null;

  return {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth },
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string | null {
  if (!buffer) return null;
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
