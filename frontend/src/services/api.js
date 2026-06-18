import axios from "axios";

const LOCAL_API_BASE_URL = "https://id-card-7c27356a0270.herokuapp.com/api";

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

const AUTH_TOKEN_KEY = "id_generator_auth_token";
const AUTH_USER_KEY = "id_generator_auth_user";

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredAuthUser = () => {
  try {
    const user = localStorage.getItem(AUTH_USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredAuthUser = (user) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

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

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();

      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = `${import.meta.env.BASE_URL || "/"}login`;
      }
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

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
      .post("/uploads/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
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
