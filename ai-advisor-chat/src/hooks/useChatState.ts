import { useReducer, useCallback, useMemo } from 'react';
import type { Advisor, Conversation, Message } from '~/types/chat';
import { isAdvisor, isConversation } from '~/lib/typeGuards';

// Chat state reducer for better state management
interface ChatState {
  advisors: Advisor[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  advisorSwitched: boolean;
}

type ChatAction =
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

const initialState: ChatState = {
  advisors: [],
  conversations: [],
  currentConversation: null,
  loading: true,
  error: null,
  advisorSwitched: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ADVISORS':
      return { ...state, advisors: action.payload };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ADVISOR_SWITCHED':
      return { ...state, advisorSwitched: action.payload };
    case 'ADD_CONVERSATION':
      return { ...state, conversations: [action.payload, ...state.conversations] };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
        currentConversation:
          state.currentConversation?.id === action.payload.id
            ? { ...state.currentConversation, ...action.payload.updates }
            : state.currentConversation,
      };
    case 'DELETE_CONVERSATION':
      const filteredConversations = state.conversations.filter(c => c.id !== action.payload);
      return {
        ...state,
        conversations: filteredConversations,
        currentConversation:
          state.currentConversation?.id === action.payload
            ? filteredConversations[0] || null
            : state.currentConversation,
      };
    case 'ADD_ADVISOR':
      return { ...state, advisors: [action.payload, ...state.advisors] };
    case 'UPDATE_ADVISOR':
      return {
        ...state,
        advisors: state.advisors.map(advisor =>
          advisor.id === action.payload.id
            ? { ...advisor, ...action.payload.updates }
            : advisor
        ),
      };
    case 'DELETE_ADVISOR':
      return {
        ...state,
        advisors: state.advisors.filter(advisor => advisor.id !== action.payload),
      };
    default:
      return state;
  }
}

/**
 * Custom hook for managing chat state with type safety and validation
 */
export const useChatState = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Advisor actions
  const setAdvisors = useCallback((advisors: Advisor[]) => {
    const validAdvisors = advisors.filter(isAdvisor);
    dispatch({ type: 'SET_ADVISORS', payload: validAdvisors });
  }, []);

  const addAdvisor = useCallback((advisor: Advisor) => {
    if (isAdvisor(advisor)) {
      dispatch({ type: 'ADD_ADVISOR', payload: advisor });
    }
  }, []);

  const updateAdvisor = useCallback((id: string, updates: Partial<Advisor>) => {
    dispatch({ type: 'UPDATE_ADVISOR', payload: { id, updates } });
  }, []);

  const deleteAdvisor = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ADVISOR', payload: id });
  }, []);

  // Conversation actions
  const setConversations = useCallback((conversations: Conversation[]) => {
    const validConversations = conversations.filter(isConversation);
    dispatch({ type: 'SET_CONVERSATIONS', payload: validConversations });
  }, []);

  const setCurrentConversation = useCallback((conversation: Conversation | null) => {
    if (!conversation || isConversation(conversation)) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
    }
  }, []);

  const addConversation = useCallback((conversation: Conversation) => {
    if (isConversation(conversation)) {
      dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
    }
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, updates } });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  // Loading and error actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setAdvisorSwitched = useCallback((switched: boolean) => {
    dispatch({ type: 'SET_ADVISOR_SWITCHED', payload: switched });
  }, []);

  // Derived state
  const hasAdvisors = useMemo(() => state.advisors.length > 0, [state.advisors.length]);
  const hasConversations = useMemo(() => state.conversations.length > 0, [state.conversations.length]);
  const activeAdvisor = useMemo(
    () => state.advisors.find(advisor => advisor.isActive),
    [state.advisors]
  );
  const recentConversations = useMemo(
    () => [...state.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    [state.conversations]
  );

  return {
    // State
    state,

    // Derived state
    hasAdvisors,
    hasConversations,
    activeAdvisor,
    recentConversations,

    // Advisor actions
    setAdvisors,
    addAdvisor,
    updateAdvisor,
    deleteAdvisor,

    // Conversation actions
    setConversations,
    setCurrentConversation,
    addConversation,
    updateConversation,
    deleteConversation,

    // Loading and error actions
    setLoading,
    setError,
    setAdvisorSwitched,

    // Dispatch for custom actions
    dispatch,
  };
};

export type UseChatStateReturn = ReturnType<typeof useChatState>;