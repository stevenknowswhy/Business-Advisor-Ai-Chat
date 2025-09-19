export const api = {
  marketplace: {
    getMarketplaceAdvisors: {} as any,
    selectAdvisor: {} as any,
    unselectAdvisor: {} as any,
    selectTeam: {} as any,
  },
  advisors: {
    getMany: {} as any,
  },
  conversations: {
    deleteConversationForMigration: {} as any,
    getConversationByIdForMigration: {} as any,
    getAllConversationsForMigration: {} as any,
    updateConversationForMigration: {} as any,
    createConversationForMigration: {} as any,
    getConversationWithMessagesForMigration: {} as any,
    createConversationForChat: {} as any,
  },
  messages: {
    getMessageByIdForMigration: {} as any,
    updateMessageForMigration: {} as any,
    deleteMessageForMigration: {} as any,
  }
} as any;
export default api;

