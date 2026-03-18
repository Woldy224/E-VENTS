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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(joinUrl(API_BASE, endpoint), {
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
    throw new Error(data.error || "Request failed");
  }

  return data;
}

/* ================= AUTH ================= */

const auth = {
  register(name: string, surname: string, email: string, password?: string) {
    return apiRequest("auth.php?action=register", {
      method: "POST",
      body: JSON.stringify({ name, surname, email, password }),
    }).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  login(email: string, password?: string) {
    return apiRequest("auth.php?action=login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  adminLogin(email: string, password: string) {
    return apiRequest("auth.php?action=admin-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then((data) => {
      if (data?.token) setAuthToken(data.token);
      return data;
    });
  },

  logout() {
    return apiRequest("auth.php?action=logout", {
      method: "POST",
    }).finally(() => setAuthToken(null));
  },

  me() {
    return apiRequest("auth.php?action=me");
  },
};

/* ================= EVENTS ================= */

const events: {
  list(): Promise<any>;
  myEvents(): Promise<any>;
  get(id: string): Promise<any>;
  create(eventData: any): Promise<any>;
  update(id: string, eventData: any): Promise<any>;
  delete(id: string): Promise<any>;
  resetTickets(id?: string): Promise<any>;
} = {
  list() {
    return apiRequest("events.php");
  },
  myEvents() {
    return apiRequest("events.php?action=my-events");
  },
  get(id: string) {
    return apiRequest(`events.php?action=get&id=${encodeURIComponent(id)}`);
  },

  create(eventData: any) {
    return apiRequest("events.php?action=create", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  update(id: string, eventData: any) {
    return apiRequest(`events.php?action=update&id=${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  },

  delete(id: string) {
    return apiRequest(`events.php?action=delete&id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  resetTickets(id?: string) {
    const url = id 
      ? `events.php?action=reset-tickets&id=${encodeURIComponent(id)}`
      : "events.php?action=reset-tickets";
    return apiRequest(url, {
      method: "POST",
    });
  },
};

/* ================= PROPOSALS ================= */

const proposals = {
  list() {
    return apiRequest("proposals.php?action=list");
  },

  submit(data: any) {
    return apiRequest("proposals.php?action=submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  approve(id: string) {
    return apiRequest(`proposals.php?action=approve&id=${encodeURIComponent(id)}`, {
      method: "POST",
    });
  },

  reject(id: string) {
    return apiRequest(`proposals.php?action=reject&id=${encodeURIComponent(id)}`, {
      method: "POST",
    });
  },
};

/* ================= TICKETS ================= */

const tickets = {
  purchase(data: any) {
    return apiRequest("tickets.php?action=purchase", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  myTickets() {
    return apiRequest("tickets.php?action=my-tickets");
  },

  eventSales(eventId: string) {
    return apiRequest(`tickets.php?action=event-sales&id=${encodeURIComponent(eventId)}`);
  },
};

export default {
  auth,
  events,
  proposals,
  tickets,
};
