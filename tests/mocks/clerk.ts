export const auth = jest.fn(async () => ({ userId: 'test_user_1' }));

export const currentUser = jest.fn(async () => ({
  id: 'test_user_1',
  fullName: 'Test User',
  imageUrl: 'https://example.com/avatar.png',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
}));

