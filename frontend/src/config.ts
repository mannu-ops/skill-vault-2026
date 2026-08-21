function getLocalApiBase() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.")
    ) {
      return `http://${host}:5000`;
    }
  }
  return "https://api.theskillvault.store";
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.theskillvault.store";

export function getApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${cleanPath}`;
}

export const courseConfig = {
  name:
    import.meta.env.VITE_COURSE_NAME ??
    "Zero to Hero: FULL STACK WEB DEVELOPER",
  subtitle: import.meta.env.VITE_COURSE_SUBTITLE ?? "Based on MERN Stack",
  description:
    import.meta.env.VITE_COURSE_DESCRIPTION ??
    "From your first line of code to building complete, real-world full-stack web applications.",
  price: import.meta.env.VITE_COURSE_PRICE ?? "[COURSE_PRICE]",
} as const;