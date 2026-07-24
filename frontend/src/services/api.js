import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:5000/api";

const normalizeApiBaseUrl = (value) => {
  const baseUrl = String(value || "").trim().replace(/\/+$/, "");

  if (!baseUrl) {
    return LOCAL_API_BASE_URL;
  }

  return /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
};

const API_BASE_URL =
  normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || LOCAL_API_BASE_URL);

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveApiAssetUrl = (value) => {
  if (!value) return "";

  if (/^(data:|blob:|https?:\/\/)/i.test(value)) {
    return value;
  }

  if (value.startsWith("/api/")) {
    return `${API_ORIGIN}${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  return value;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const templateAPI = {
  getAll: (category) =>
    api.get(
      `/templates${category && category !== "All" ? `?category=${category}` : ""}`,
    ),

  getById: (id) => api.get(`/templates/${id}`),

  create: (data) => api.post("/templates", data),

  update: (id, data) => api.put(`/templates/${id}`, data),

  delete: (id) => api.delete(`/templates/${id}`),
};

export const cardAPI = {
  getAll: () => api.get("/cards"),

  getById: (id) => api.get(`/cards/${id}`),

  create: (data) => api.post("/cards", data),

  update: (id, data) => api.put(`/cards/${id}`, data),

  delete: (id) => api.delete(`/cards/${id}`),
};

export const uploadAPI = {
  image: (file, options = {}) => {
    const formData = new FormData();
    formData.append("photo", file);

    if (options.removeBackground) {
      formData.append("removeBackground", "true");
    }

    if (options.fileName) {
      formData.append("fileName", options.fileName);
    }

    return api
      .post("/uploads/photo", formData)
      .then((response) => {
        const imageUrl =
          response.data.imageUrl || response.data.file?.imageUrl || "";

        return {
          ...response,
          data: {
            ...response.data,
            imageUrl: resolveApiAssetUrl(imageUrl),
          },
        };
      });
  },
};
