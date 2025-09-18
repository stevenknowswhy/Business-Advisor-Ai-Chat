import type { Advisor, Conversation } from "./chat";

// API client for conversations
export class ConversationsAPI {
  static async getAll(): Promise<Conversation[]> {
    const response = await fetch("/api/conversations", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }
    return response.json();
  }

  static async getById(id: string): Promise<Conversation> {
    const response = await fetch(`/api/conversations/${id}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }
    return response.json();
  }

  static async create(data: { title?: string; advisorId?: string }): Promise<Conversation> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update conversation");
    }
    return response.json();
  }

  static async delete(id: string): Promise<void> {
    console.log("ConversationsAPI.delete called with ID:", id);

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        signal: controller.signal,
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      console.log("Delete response status:", response.status);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to delete conversation";
        let errorDetails = null;

        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData.details;
        } catch (parseError) {
          console.log("Failed to parse error response:", parseError);
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Provide specific error messages based on status code
        if (response.status === 400) {
          throw new Error("Invalid conversation ID. Please refresh the page and try again.");
        } else if (response.status === 401) {
          throw new Error("Please sign in to delete conversations");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to delete this conversation");
        } else if (response.status === 404) {
          throw new Error("Conversation not found or already deleted");
        } else if (response.status === 408) {
          throw new Error("Delete operation timed out. The conversation may have been deleted. Please refresh the page.");
        } else if (response.status === 503) {
          throw new Error("Service temporarily unavailable. Please try again in a moment.");
        } else if (response.status >= 500) {
          // Include more specific error information for 500 errors
          const detailedMessage = errorDetails
            ? `Server error: ${errorMessage}. Details: ${errorDetails}`
            : `Server error: ${errorMessage}. Please try again or contact support if the issue persists.`;
          throw new Error(detailedMessage);
        } else {
          throw new Error(errorMessage);
        }
      }

      console.log("Conversation deleted successfully");
      // Success - no need to parse response for DELETE (should be 204 No Content)
    } catch (error) {
      console.error("ConversationsAPI.delete error:", error);

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Request timed out. Please check your connection and try again.");
      }

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
    const response = await fetch("/api/advisors", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch advisors");
    }
    return response.json();
  }

  static async create(advisorData: { firstName: string; lastName: string; title: string; jsonConfiguration: string; imageUrl?: string }): Promise<Advisor> {
    const response = await fetch("/api/advisors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(advisorData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create advisor");
    }
    return response.json();
  }

  static async update(id: string, advisorData: { firstName: string; lastName: string; title: string; jsonConfiguration: string; imageUrl?: string }): Promise<Advisor> {
    const response = await fetch(`/api/advisors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(advisorData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update advisor");
    }
    return response.json();
  }

  static async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/advisors/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete advisor");
    }
    return response.json();
  }
}

// API client for messages
export class MessagesAPI {
  static async update(id: string, data: { content: string }): Promise<{ success: boolean; updatedMessage: any }> {
    const response = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update message");
    }
    return response.json();
  }

  static async delete(id: string): Promise<{ success: boolean; deletedCount: number; deletedMessageIds: string[] }> {
    const response = await fetch(`/api/messages/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete message");
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
    credentials: "include",
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
