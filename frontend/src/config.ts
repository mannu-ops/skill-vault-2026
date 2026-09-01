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
  import.meta.env.VITE_API_BASE_URL || getLocalApiBase();

export function getApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || getLocalApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
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