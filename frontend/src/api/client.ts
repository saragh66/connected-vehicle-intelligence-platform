import axios from "axios";

// Chemin relatif : Vite proxy redirige automatiquement vers http://127.0.0.1:8000
export const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Log clair en cas d'erreur réseau, pour debug immédiat
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API ERROR]", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);