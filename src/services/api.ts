import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ledger_token") || sessionStorage.getItem("ledger_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ledger_token");
      sessionStorage.removeItem("ledger_token");
      if (!location.pathname.includes("/login")) location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function downloadBlob(url: string, filename: string) {
  return api.get(url, { responseType: "blob" }).then((response) => {
    const href = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
  });
}
