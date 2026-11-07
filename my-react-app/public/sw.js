// Minimal service worker: shows a system notification for each push event,
// and focuses/opens the app when the user clicks it.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = { title: "New message", body: "", conversationId: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "New message", {
      body: payload.body,
      icon: "/icons.svg",
      tag: payload.conversationId || undefined,
      data: { conversationId: payload.conversationId },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
