import type { RoomRole } from "./roomService";

export function assertAdminRole(role: RoomRole | null | undefined) {
  if (role !== "admin") {
    throw new Error("Permission denied");
  }
}
