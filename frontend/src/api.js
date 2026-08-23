import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Inject JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("lf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap axios responses and surface error messages from the API
async function request(fn) {
  try {
    const res = await fn();
    return { data: res.data, error: null };
  } catch (err) {
    const apiErrors = err.response?.data?.errors;
    const message = apiErrors
      ? apiErrors.join(", ")
      : err.message || "An unexpected error occurred";
    return { data: null, error: message };
  }
}

export const api = {
  // Auth
  register: (body) => request(() => client.post("/auth/register", body)),
  login:    (body) => request(() => client.post("/auth/login", body)),
  me:       ()     => request(() => client.get("/auth/me")),

  // Reports
  createReport: (body)         => request(() => client.post("/reports", body)),
  listReports:  (params = {})  => request(() => client.get("/reports", { params })),
  listMine:     ()             => request(() => client.get("/reports/mine")),
  getMatches:   (id)           => request(() => client.get(`/reports/${id}/matches`)),
  getAllMatches:()             => request(() => client.get('/reports/all-matches')),
  updateStatus: (id, status)   => request(() => client.patch(`/reports/${id}`, { status })),
  claimReport:  (id, answer)   => request(() => client.post(`/reports/${id}/claim`, { answer })),
  getUnreadCount: ()           => request(() => client.get(`/messages/unread-count`)),
  getMessages:  (lostId, foundId) => request(() => client.get(`/messages/${lostId}/${foundId}`)),
  sendMessage:  (lostId, foundId, message) => request(() => client.post(`/messages/${lostId}/${foundId}`, { message })),
  uploadPhoto:  (file) => request(() => {
    const formData = new FormData();
    formData.append('image', file);
    return client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }),
  health:       ()             => request(() => client.get("/health")),
};
