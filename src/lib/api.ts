import type { Advisor, Conversation } from "./chat";

// API client for conversations
export class ConversationsAPI {
  static async getAll(): Promise<Conversation[]> {
    const response = await fetch("/api/conversations");
    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }
    return response.json();
  }

  static async getById(id: string): Promise<Conversation> {
    const response = await fetch(`/api/conversations/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }
    return response.json();
  }

  static async create(data: { title?: string; advisorId?: string }): Promise<Conversation> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create conversation");
    }
    return response.json();
  }

  static async update(id: string, data: { title?: string; activeAdvisorId?: string }): Promise<Conversation> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update conversation");
    }
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete conversation");
    }
  }
}

// API client for advisors
export class AdvisorsAPI {
  static async getAll(): Promise<Advisor[]> {
    const response = await fetch("/api/advisors");
    if (!response.ok) {
      throw new Error("Failed to fetch advisors");
    }
    return response.json();
  }
}

// Error handling utility
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Generic API request helper
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new APIError(
      errorText || "API request failed",
      response.status,
      response.statusText
    );
  }

  // Handle empty responses (like DELETE)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
