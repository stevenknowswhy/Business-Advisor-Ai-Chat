// General Jest setup for tests
import '@testing-library/jest-dom';

// Minimal web fetch API stubs for Next server imports in Jest
// Avoid external deps to keep tests hermetic
const g: any = globalThis as any;
if (typeof g.Request === 'undefined') {
  g.Request = class RequestMock {} as any;
}
if (typeof g.Response === 'undefined') {
  g.Response = class ResponseMock { static json(data:any){return { json: data, status: 200 };} } as any;
}
if (typeof g.Headers === 'undefined') {
  g.Headers = class HeadersMock {} as any;
}


jest.setTimeout(30000);

// Mock TransformStream for AI SDK compatibility
global.TransformStream = class TransformStream {
  readable: any;
  writable: any;
  constructor() {
    this.readable = {};
    this.writable = {};
  }
} as any;

// Prefer TEST_DATABASE_URL for safety; fall back to DATABASE_URL only if TEST_DATABASE_URL is not set
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Mock Clerk server SDK by default; individual tests can override
jest.mock('@clerk/nextjs/server', () => require('./mocks/clerk'));

// Mock Convex React hooks for testing
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useAction: jest.fn(),
}));

// Mock Convex generated files - these will be mocked in individual test files as needed

// Mock chat utilities
jest.mock('~/lib/chat', () => ({
  getAdvisorInitials: (input?: any) => {
    if (typeof input === 'string') {
      return input.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || 'AA';
    }
    return input?.persona?.name?.split(' ').map((n: string) => n[0]).join('') || 'AA';
  },
  getAdvisorColor: () => 'bg-blue-500',
}));

// Provide default Convex URL to avoid env failures in server-side modules during tests
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3333';
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Always mock advisors barrel in tests to avoid rendering heavy components
jest.mock('~/components/advisors', () => require('./mocks/advisorsBarrelMock'));

// Environment & polyfills
process.env.NEXT_PUBLIC_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:9999';
// Polyfill setImmediate for Prisma in jsdom
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof global.setImmediate === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.setImmediate = (fn: any, ...args: any[]) => setTimeout(fn, 0, ...args);
}

// Minimal conversations module mock used by API route tests
jest.mock('~/server/convex/conversations', () => {
  return {
    deleteConversation: jest.fn(async (_id: string) => ({ success: true })),
    getConversationById: jest.fn(async (id: string) => ({ _id: id, createdAt: Date.now(), updatedAt: Date.now(), messages: [] })),
    updateConversation: jest.fn(async () => ({ success: true })),
    formatConversationWithMessagesForClient: (conv: any) => ({
      id: conv._id,
      title: conv.title || 'New Conversation',
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      activeAdvisor: null,
      messages: conv.messages || [],
    }),
  };
});

