export const CURRENT_ORBIT_TYPE_USER_ID = 1;

let currentUserId: number | null = null;

export function getCurrentOrbitTypeUserId(): number {
  currentUserId ??= CURRENT_ORBIT_TYPE_USER_ID;
  return currentUserId;
}
