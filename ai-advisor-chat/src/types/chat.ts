// Enhanced TypeScript types for the chat system

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message interface with strict typing
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  advisor?: string; // Advisor ID for assistant messages
  createdAt: Date | string;
  updatedAt?: Date | string;
  isEdited?: boolean;
  isDeleted?: boolean;
}

/**
 * Advisor interface with comprehensive typing
 */
export interface Advisor {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  jsonConfiguration: string;
  imageUrl?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  isActive?: boolean;
  isSystem?: boolean;
}

/**
 * Conversation interface with enhanced typing
 */
export interface Conversation {
  id: string;
  title: string;
  advisorId: string;
  messages?: Message[];
  createdAt: Date | string;
  updatedAt: Date | string;
  isArchived?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Advisor form data for creation and updates
 */
export interface AdvisorFormData {
  firstName: string;
  lastName: string;
  title: string;
  jsonConfiguration: string;
  imageUrl?: string;
}

/**
 * Chat state interface
 */
export interface ChatState {
  advisors: Advisor[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  advisorSwitched: boolean;
}

/**
 * Chat action types for useReducer
 */
export type ChatAction =
  | { type: 'SET_ADVISORS'; payload: Advisor[] }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ADVISOR_SWITCHED'; payload: boolean }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<Conversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'ADD_ADVISOR'; payload: Advisor }
  | { type: 'UPDATE_ADVISOR'; payload: { id: string; updates: Partial<Advisor> } }
  | { type: 'DELETE_ADVISOR'; payload: string };

/**
 * API response interfaces
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error interface for API errors
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date | string;
}

/**
 * Chat configuration interface
 */
export interface ChatConfig {
  maxMessageLength: number;
  maxMessagesPerConversation: number;
  maxConversationsPerUser: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  enableMarkdown: boolean;
  enableCodeHighlight: boolean;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  messageNotifications: boolean;
  soundEffects: boolean;
  autoSave: boolean;
  language: string;
}

/**
 * Chat statistics interface
 */
export interface ChatStats {
  totalMessages: number;
  totalConversations: number;
  totalAdvisors: number;
  averageMessagesPerConversation: number;
  mostActiveAdvisor: Advisor | null;
  createdAt: Date | string;
  lastActivity: Date | string;
}

/**
 * Search filters interface
 */
export interface SearchFilters {
  query?: string;
  advisorId?: string;
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  messageRole?: MessageRole;
  limit?: number;
  offset?: number;
}

/**
 * Chat event types
 */
export type ChatEventType =
  | 'message_sent'
  | 'message_received'
  | 'message_edited'
  | 'message_deleted'
  | 'conversation_created'
  | 'conversation_updated'
  | 'conversation_deleted'
  | 'advisor_switched'
  | 'error_occurred';

/**
 * Chat event interface
 */
export interface ChatEvent {
  type: ChatEventType;
  payload: Record<string, unknown>;
  timestamp: Date | string;
  userId?: string;
  sessionId?: string;
}

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'status' | 'error';
  data: Record<string, unknown>;
  timestamp: Date | string;
}

/**
 * Component props interfaces
 */
export interface AdvisorRailProps {
  advisors: Advisor[];
  conversations: Conversation[];
  activeAdvisorId: string;
  currentConversationId: string | null;
  onAdvisorSelect: (advisorId: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onCreateAdvisor: (advisorData: AdvisorFormData) => Promise<void>;
  onUpdateAdvisor: (advisorId: string, advisorData: AdvisorFormData) => Promise<void>;
  isCollapsed: boolean;
}

export interface MessageListProps {
  messages: Message[];
  advisors: Advisor[];
  isLoading: boolean;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

export interface MessageInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  advisors: Advisor[];
}

export interface ConversationHeaderProps {
  conversation: Conversation | null;
  activeAdvisor: Advisor | null;
  advisorSwitched: boolean;
  onTitleUpdate: (conversationId: string, newTitle: string) => void;
}

/**
 * Hook return types
 */
export interface UseChatStateReturn {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  actions: {
    setAdvisors: (advisors: Advisor[]) => void;
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setAdvisorSwitched: (switched: boolean) => void;
    addConversation: (conversation: Conversation) => void;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;
    deleteConversation: (id: string) => void;
    addAdvisor: (advisor: Advisor) => void;
    updateAdvisor: (id: string, updates: Partial<Advisor>) => void;
    deleteAdvisor: (id: string) => void;
  };
}

export interface UseErrorHandlerReturn {
  error: string | null;
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
}

/**
 * Utility types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;