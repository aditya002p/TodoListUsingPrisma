const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || "";
};

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }
    return response.json();
  },

  post: async (endpoint: string, data: unknown) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }
    return response.json();
  },

  put: async (endpoint: string, data: unknown) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API Error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }
    return response.json();
  },
};
