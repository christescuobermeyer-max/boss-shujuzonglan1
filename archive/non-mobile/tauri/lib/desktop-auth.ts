const DESKTOP_AUTH_KEY = "desktop-auth-ok";

export function isDesktopLoggedIn() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DESKTOP_AUTH_KEY) === "1";
}

export function markDesktopLoggedIn() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DESKTOP_AUTH_KEY, "1");
}

export function clearDesktopLoggedIn() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DESKTOP_AUTH_KEY);
}
