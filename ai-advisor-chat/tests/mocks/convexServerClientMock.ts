export const getUserConversations = jest.fn(async () => ([]));
export const getConversationById = jest.fn(async (id: string) => ({
  _id: id,
  title: 'Mock Conversation',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
}));
export const createConversation = jest.fn(async () => ({ _id: 'conv_1' }));
export const updateConversation = jest.fn(async () => ({ success: true }));
export const deleteConversation = jest.fn(async () => ({ success: true }));
export const getMessageById = jest.fn(async () => null);
export const updateMessage = jest.fn(async () => ({ success: true }));
export const deleteMessage = jest.fn(async () => ({ success: true }));
export const getConversationWithMessages = jest.fn(async () => ({
  _id: 'conv_1',
  title: 'Mock',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
}));
export const createConversationForChat = jest.fn(async () => ({ _id: 'conv_1' }));
export const updateConversationActiveAdvisor = jest.fn(async () => ({ success: true }));
export const createUserMessage = jest.fn(async () => ({ _id: 'msg_1' }));
export const createAdvisorMessage = jest.fn(async () => ({ _id: 'msg_2' }));
export const getMessageCount = jest.fn(async () => 0);
export const getConversationHistory = jest.fn(async () => []);
export const updateConversationTitle = jest.fn(async () => ({ success: true }));
export const getConversationMessages = jest.fn(async () => ([]));
export const sendMessage = jest.fn(async () => ({ success: true }));
export const getOrCreateUser = jest.fn(async () => ({ _id: 'user_1' }));
export default {} as any;

