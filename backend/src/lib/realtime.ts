import { EventEmitter } from "node:events";

const updates = new EventEmitter();
updates.setMaxListeners(0);

export function publishUpdate() {
  updates.emit("update");
}

export function subscribeToUpdates(listener: () => void) {
  updates.on("update", listener);
  return () => updates.off("update", listener);
}
