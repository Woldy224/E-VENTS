const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-production-68cd.up.railway.app/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    sessionStorage.setItem("auth_token", token);
  } else {
    sessionStorage.removeItem("auth_token");
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = sessionStorage.getItem("auth_token");
  }
  return authToken;
}

function joinUrl(base: string, endpoint: string) {
  const b = base.replace(/\/+$/, "");
  const e = endpoint.replace(/^\/+/, "");
  return `${b}/${e}`;
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const separator = endpoint.includes("?") ? "&" : "?";
  const finalEndpoint = token ? `${endpoint}${separator}token=${token}` : endpoint;
  const url = joinUrl(API_BASE, finalEndpoint);
  console.log("🚀 API Request to:", url);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Réponse API invalide");
  }

  if (!response.ok) {
    throw new Error(data.error || "Une erreur est survenue");
  }

  return data;
}

export default {
  auth: {
    register: (name: string, surname: string, email: string, password: string) =>
      apiRequest("auth?action=register", {
        method: "POST",
        body: JSON.stringify({ name, surname, email, password }),
      }),
    login: (email: string, password: string) =>
      apiRequest("auth?action=login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    adminLogin: (email: string, password: string) =>
      apiRequest("auth?action=admin-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => apiRequest("auth?action=logout", { method: "POST" }),
    me: () => apiRequest("auth?action=me", { method: "GET" }),
  },
  events: {
    list: () => apiRequest("events?action=list", { method: "GET" }),
    create: (eventData: any) =>
      apiRequest("events?action=create", {
        method: "POST",
        body: JSON.stringify(eventData),
      }),
    update: (id: string, eventData: any) =>
      apiRequest(`events?action=update&id=${id}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
      }),
    delete: (id: string) =>
      apiRequest(`events?action=delete&id=${id}`, { method: "DELETE" }),
    resetTickets: (eventId?: string) => 
      apiRequest(`events?action=reset-tickets${eventId ? `&id=${eventId}` : ''}`, { method: 'POST' }),
  },
  proposals: {
    submit: (proposalData: any) =>
      apiRequest("proposals?action=submit", {
        method: "POST",
        body: JSON.stringify(proposalData),
      }),
    list: () => apiRequest("proposals?action=list", { method: "GET" }),
    approve: (id: string) =>
      apiRequest(`proposals?action=approve&id=${id}`, { method: "POST" }),
    reject: (id: string) =>
      apiRequest(`proposals?action=reject&id=${id}`, { method: "POST" }),
  },
  tickets: {
    purchase: (eventId: string, quantity: number, totalAmount: number) =>
      apiRequest("tickets?action=purchase", {
        method: "POST",
        body: JSON.stringify({ eventId, quantity, totalAmount }),
      }),
    myTickets: () => apiRequest("tickets?action=my-tickets", { method: "GET" }),
  },
};
