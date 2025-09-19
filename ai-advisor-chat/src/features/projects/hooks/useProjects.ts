import * as React from "react";

// Project types
export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: "active" | "archived" | "completed";
  tags: string[];
  color?: string;
  icon?: string;
  iconUrl?: string;
  conversationCount: number;
  lastActivity: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectStats {
  totalConversations: number;
  totalMessages: number;
  uniqueAdvisors: number;
  createdAt: number;
  lastActivity: number;
}

export interface ProjectConversation {
  _id: string;
  title?: string;
  userId: string;
  activeAdvisorId?: string;
  activeAdvisor?: any;
  createdAt: number;
  updatedAt: number;
  addedToProjectAt: number;
  addedBy: string;
}

// API functions
class ProjectsAPI {
  getAuthHeaders() {
    // This would normally get the auth token from Clerk
    return {};
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  }

  async createProject(data: {
    name: string;
    description?: string;
    tags?: string[];
    color?: string;
    icon?: string;
    iconUrl?: string;
  }): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  }

  async updateProject(
    projectId: string,
    data: {
      name?: string;
      description?: string;
      status?: "active" | "archived" | "completed";
      tags?: string[];
      color?: string;
      icon?: string;
      iconUrl?: string;
    }
  ): Promise<Project> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  }

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }

  async getProjectConversations(projectId: string): Promise<ProjectConversation[]> {
    const response = await fetch(`/api/projects/${projectId}/conversations`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project conversations');
    }

    return response.json();
  }

  async addConversationToProject(
    projectId: string,
    conversationId: string
  ): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ conversationId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add conversation to project');
    }
  }

  async removeConversationFromProject(
    projectId: string,
    conversationId: string
  ): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove conversation from project');
    }
  }

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const response = await fetch(`/api/projects/${projectId}/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project stats');
    }

    return response.json();
  }
}

export const projectsAPI = new ProjectsAPI();

// Hooks
export function useProjects() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsAPI.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = React.useCallback(async (data: {
    name: string;
    description?: string;
    tags?: string[];
    color?: string;
    icon?: string;
    iconUrl?: string;
  }) => {
    try {
      const newProject = await projectsAPI.createProject(data);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      throw err;
    }
  }, []);

  const updateProject = React.useCallback(async (
    projectId: string,
    data: {
      name?: string;
      description?: string;
      status?: "active" | "archived" | "completed";
      tags?: string[];
      color?: string;
      icon?: string;
      iconUrl?: string;
    }
  ) => {
    try {
      const updatedProject = await projectsAPI.updateProject(projectId, data);
      setProjects(prev => prev.map(p => p._id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err: any) {
      setError(err.message || "Failed to update project");
      throw err;
    }
  }, []);

  const deleteProject = React.useCallback(async (projectId: string) => {
    try {
      await projectsAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
      throw err;
    }
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}

export function useProject(projectId: string) {
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProject = React.useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: projectsAPI.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = React.useCallback(async (data: {
    name?: string;
    description?: string;
    status?: "active" | "archived" | "completed";
    tags?: string[];
    color?: string;
    icon?: string;
    iconUrl?: string;
  }) => {
    try {
      const updatedProject = await projectsAPI.updateProject(projectId, data);
      setProject(updatedProject);
      return updatedProject;
    } catch (err: any) {
      setError(err.message || "Failed to update project");
      throw err;
    }
  }, [projectId]);

  return {
    project,
    loading,
    error,
    updateProject,
    refetch: fetchProject,
  };
}

export function useProjectConversations(projectId: string) {
  const [conversations, setConversations] = React.useState<ProjectConversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchConversations = React.useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await projectsAPI.getProjectConversations(projectId);
      setConversations(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch project conversations");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const addConversation = React.useCallback(async (conversationId: string) => {
    try {
      await projectsAPI.addConversationToProject(projectId, conversationId);
      await fetchConversations(); // Refresh the list
    } catch (err: any) {
      setError(err.message || "Failed to add conversation to project");
      throw err;
    }
  }, [projectId, fetchConversations]);

  const removeConversation = React.useCallback(async (conversationId: string) => {
    try {
      await projectsAPI.removeConversationFromProject(projectId, conversationId);
      setConversations(prev => prev.filter(c => c._id !== conversationId));
    } catch (err: any) {
      setError(err.message || "Failed to remove conversation from project");
      throw err;
    }
  }, [projectId]);

  return {
    conversations,
    loading,
    error,
    addConversation,
    removeConversation,
    refetch: fetchConversations,
  };
}

export function useProjectStats(projectId: string) {
  const [stats, setStats] = React.useState<ProjectStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await projectsAPI.getProjectStats(projectId);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch project stats");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}