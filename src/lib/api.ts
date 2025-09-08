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
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to delete conversation";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Provide specific error messages based on status code
        if (response.status === 404) {
          throw new Error("Conversation not found or you don't have permission to delete it");
        } else if (response.status === 401) {
          throw new Error("Please sign in to delete conversations");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to delete this conversation");
        } else if (response.status >= 500) {
          throw new Error("Server error occurred while deleting conversation. Please try again.");
        } else {
          throw new Error(errorMessage);
        }
      }

      // Success - no need to parse response for DELETE (should be 204 No Content)
    } catch (error) {
      // Handle network errors (like connection refused)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error("Unable to connect to server. Please check your connection and try again.");
      }

      // Re-throw other errors
      throw error;
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
