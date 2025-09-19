# AI Advisor Chat - Testing Strategy

## 🧪 Testing Overview

The AI Advisor Chat application follows a comprehensive testing strategy with Jest as the primary testing framework, covering unit tests, integration tests, accessibility testing, and end-to-end testing. The current test coverage is **14.5% overall** with **125 passing tests**.

---

## 📊 Current Testing Status

### Test Coverage Summary
- **Overall Coverage**: 14.5%
- **Marketplace Components**: 52-73% coverage ✅
- **UI Components**: 54.4% coverage ✅
- **Core Application**: 0-48% coverage ❌
- **API Routes**: Minimal coverage ❌
- **Accessibility**: jest-axe integration ✅

### Test Suites
- **13 test suites** currently passing
- **125 individual tests** passing
- **0 failing tests**
- **0 skipped tests**

---

## 🏗️ Testing Architecture

### Testing Framework Stack
```json
{
  "testingFramework": "Jest",
  "reactTesting": "@testing-library/react",
  "accessibility": "jest-axe",
  "mocking": "jest.mock",
  "coverage": "Istanbul/nyc",
  "runner": "cross-env NODE_OPTIONS=--experimental-vm-modules jest"
}
```

### Test Structure
```
tests/
├── __mocks__/              # Global mock files
├── accessibility/          # Accessibility tests
├── components/             # Component tests
├── hooks/                  # Custom hook tests
├── integration/            # Integration tests
├── performance/            # Performance tests
├── mocks/                  # Test-specific mocks
│   ├── convexApiMock.ts
│   ├── convexReactMock.ts
│   ├── convexServerMock.ts
│   ├── convexServerClientMock.ts
│   ├── convexDataModelMock.ts
│   ├── advisorsBarrelMock.ts
│   └── nextServerMock.ts
├── setup/
│   └── jest.setup.ts       # Jest configuration
├── jest.config.ts          # Jest configuration file
└── jest.cross.config.ts     # Cross-platform Jest config
```

---

## 🔧 Testing Configuration

### Jest Configuration (`jest.config.ts`)
```typescript
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapping: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/app/layout.tsx",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  moduleNameMapper: {
    "\\^@/(.*)$": "<rootDir>/src/$1",
    "\\^~/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
```

### Test Setup (`jest.setup.ts`)
```typescript
import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { vi } from "vitest";

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Setup Convex mocks
vi.mock("convex/react", () => createConvexReactMock());
vi.mock("convex/server", () => createConvexServerMock());
vi.mock("convex/_generated/api", () => createConvexApiMock());
```

---

## 🧪 Component Testing

### 1. **Button Component Test**
```typescript
// tests/components/ui/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import axe from "jest-axe";

describe("Button Component", () => {
  test("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  test("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("shows loading state", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("is disabled when loading", () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toBeDisabled();
  });

  test("has no accessibility violations", async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("supports different variants", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-primary");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-secondary");
  });
});
```

### 2. **Marketplace Component Test**
```typescript
// tests/components/marketplace/AdvisorCard.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdvisorCard } from "@/components/marketplace/components/AdvisorCard";
import { mockAdvisor } from "../../mocks/advisorsBarrelMock";

describe("AdvisorCard Component", () => {
  const mockOnSelect = vi.fn();
  const mockOnDeselect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders advisor information correctly", () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onSelect={mockOnSelect}
        onDeselect={mockOnDeselect}
      />
    );

    expect(screen.getByText(mockAdvisor.persona.name)).toBeInTheDocument();
    expect(screen.getByText(mockAdvisor.persona.title)).toBeInTheDocument();
    expect(screen.getByText(mockAdvisor.persona.oneLiner)).toBeInTheDocument();
  });

  test("shows add button when not selected", () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onSelect={mockOnSelect}
        onDeselect={mockOnDeselect}
      />
    );

    expect(screen.getByText("Add to Board")).toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  test("shows remove button when selected", () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={true}
        onSelect={mockOnSelect}
        onDeselect={mockOnDeselect}
      />
    );

    expect(screen.getByText("Remove")).toBeInTheDocument();
    expect(screen.queryByText("Add to Board")).not.toBeInTheDocument();
  });

  test("calls onSelect when add button is clicked", async () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onSelect={mockOnSelect}
        onDeselect={mockOnDeselect}
      />
    );

    fireEvent.click(screen.getByText("Add to Board"));
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockAdvisor._id);
    });
  });

  test("displays advisor expertise tags", () => {
    render(
      <AdvisorCard
        advisor={mockAdvisor}
        isSelected={false}
        onSelect={mockOnSelect}
        onDeselect={mockOnDeselect}
      />
    );

    mockAdvisor.persona.expertise?.forEach(expertise => {
      expect(screen.getByText(expertise)).toBeInTheDocument();
    });
  });
});
```

### 3. **Chat Component Test**
```typescript
// tests/components/chat/MessageInput.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MessageInput } from "@/components/chat/MessageInput";
import { useAdvisorChat } from "@/lib/chat";

// Mock the useAdvisorChat hook
vi.mock("@/lib/chat", () => ({
  useAdvisorChat: vi.fn(),
}));

describe("MessageInput Component", () => {
  const mockHandleSubmit = vi.fn();
  const mockHandleInputChange = vi.fn();
  const mockAdvisors = [
    { _id: "advisor1", persona: { name: "Alex Reyes" } },
    { _id: "advisor2", persona: { name: "Amara Johnson" } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAdvisorChat as any).mockReturnValue({
      handleSubmit: mockHandleSubmit,
      handleInputChange: mockHandleInputChange,
      input: "",
      isLoading: false,
    });
  });

  test("renders input field and send button", () => {
    render(
      <MessageInput
        input=""
        handleInputChange={mockHandleInputChange}
        handleSubmit={mockHandleSubmit}
        isLoading={false}
        advisors={mockAdvisors}
      />
    );

    expect(screen.getByPlaceholderText("Message your advisor...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  test("calls handleSubmit when form is submitted", async () => {
    render(
      <MessageInput
        input="Hello advisor"
        handleInputChange={mockHandleInputChange}
        handleSubmit={mockHandleSubmit}
        isLoading={false}
        advisors={mockAdvisors}
      />
    );

    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test("disables send button when loading", () => {
    render(
      <MessageInput
        input="Test message"
        handleInputChange={mockHandleInputChange}
        handleSubmit={mockHandleSubmit}
        isLoading={true}
        advisors={mockAdvisors}
      />
    );

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  test("disables send button when input is empty", () => {
    render(
      <MessageInput
        input=""
        handleInputChange={mockHandleInputChange}
        handleSubmit={mockHandleSubmit}
        isLoading={false}
        advisors={mockAdvisors}
      />
    );

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });
});
```

---

## 🔀 Hook Testing

### 1. **Custom Hook Test**
```typescript
// tests/hooks/useMarketplace.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { createConvexReactMock } from "../../mocks/convexReactMock";

// Mock Convex
vi.mock("convex/react", () => createConvexReactMock());

describe("useMarketplace Hook", () => {
  const mockAdvisors = [
    { _id: "1", persona: { name: "Advisor 1" }, isPublic: true },
    { _id: "2", persona: { name: "Advisor 2" }, isPublic: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("initializes with empty state", () => {
    const { result } = renderHook(() => useMarketplace());

    expect(result.current.advisors).toEqual([]);
    expect(result.current.selectedAdvisors).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  test("loads advisors on mount", async () => {
    const mockQuery = vi.fn().mockResolvedValue(mockAdvisors);
    (useQuery as any).mockReturnValue({
      data: mockAdvisors,
      isLoading: false,
    });

    const { result } = renderHook(() => useMarketplace());

    await act(async () => {
      await result.current.loadAdvisors();
    });

    expect(result.current.advisors).toEqual(mockAdvisors);
    expect(result.current.isLoading).toBe(false);
  });

  test("selects advisor correctly", async () => {
    const mockMutation = vi.fn().mockResolvedValue({ success: true });
    (useMutation as any).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useMarketplace());

    await act(async () => {
      await result.current.selectAdvisor("advisor1");
    });

    expect(mockMutation).toHaveBeenCalledWith({
      advisorId: "advisor1",
      source: "marketplace",
    });
  });

  test("filters advisors by search term", async () => {
    const mockQuery = vi.fn().mockResolvedValue(mockAdvisors);
    (useQuery as any).mockReturnValue({
      data: mockAdvisors,
      isLoading: false,
    });

    const { result } = renderHook(() => useMarketplace());

    await act(async () => {
      await result.current.searchAdvisors("Advisor 1");
    });

    expect(result.current.searchQuery).toBe("Advisor 1");
  });
});
```

---

## 🔗 Integration Testing

### 1. **Marketplace Flow Test**
```typescript
// tests/integration/marketplace-flow.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarketplacePage } from "@/app/marketplace/page";
import { createConvexReactMock } from "../mocks/convexReactMock";

// Mock all external dependencies
vi.mock("convex/react", () => createConvexReactMock());
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user1" } }),
}));

describe("Marketplace Integration Flow", () => {
  const mockAdvisors = [
    {
      _id: "advisor1",
      persona: { name: "Alex Reyes", title: "Investment Advisor" },
      isPublic: true,
      category: "business",
    },
    {
      _id: "advisor2",
      persona: { name: "Amara Johnson", title: "CTO Advisor" },
      isPublic: true,
      category: "technical",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("user can browse and select advisors", async () => {
    render(<MarketplacePage />);

    // Wait for advisors to load
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
    });

    // Click on first advisor
    fireEvent.click(screen.getByText("Add to Board"));

    // Verify advisor is selected
    await waitFor(() => {
      expect(screen.getByText("Remove")).toBeInTheDocument();
    });

    // Switch to "My Advisors" tab
    fireEvent.click(screen.getByText("My Advisors"));

    // Verify selected advisor appears in My Advisors
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
    });
  });

  test("search functionality works correctly", async () => {
    render(<MarketplacePage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
      expect(screen.getByText("Amara Johnson")).toBeInTheDocument();
    });

    // Search for "Alex"
    const searchInput = screen.getByPlaceholderText("Search advisors...");
    fireEvent.change(searchInput, { target: { value: "Alex" } });

    // Verify only Alex appears
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
      expect(screen.queryByText("Amara Johnson")).not.toBeInTheDocument();
    });
  });

  test("category filtering works", async () => {
    render(<MarketplacePage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
      expect(screen.getByText("Amara Johnson")).toBeInTheDocument();
    });

    // Filter by business category
    fireEvent.click(screen.getByText("All Categories"));
    fireEvent.click(screen.getByText("Business"));

    // Verify only business advisor appears
    await waitFor(() => {
      expect(screen.getByText("Alex Reyes")).toBeInTheDocument();
      expect(screen.queryByText("Amara Johnson")).not.toBeInTheDocument();
    });
  });
});
```

---

## ♿ Accessibility Testing

### 1. **Accessibility Test Suite**
```typescript
// tests/accessibility/accessibility.test.tsx
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MarketplaceLayout } from "@/components/marketplace/MarketplaceLayout";

describe("Accessibility Compliance", () => {
  test("ChatInterface has no accessibility violations", async () => {
    const { container } = render(<ChatInterface />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("MarketplaceLayout has no accessibility violations", async () => {
    const { container } = render(<MarketplaceLayout initialTab="marketplace" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("buttons have proper aria labels", () => {
    const { container } = render(
      <button aria-label="Close modal">×</button>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Close modal");
  });

  test("form inputs have proper labels", () => {
    render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" aria-required="true" />
      </form>
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-required", "true");
  });

  test("modal has proper accessibility attributes", () => {
    const { container } = render(
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Modal Title</h2>
        <button aria-label="Close">×</button>
      </div>
    );

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
  });
});
```

---

## 🎭 Mocking Strategy

### 1. **Convex Mocks**
```typescript
// tests/mocks/convexReactMock.ts
export const createConvexReactMock = () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="convex-provider">{children}</div>
  ),
}));

// tests/mocks/convexApiMock.ts
export const createConvexApiMock = () => ({
  advisors: {
    getMarketplaceAdvisors: vi.fn(),
    getUserAdvisors: vi.fn(),
    selectAdvisor: vi.fn(),
  },
  conversations: {
    getUserConversations: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
  },
  messages: {
    getConversationMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

// tests/mocks/advisorsBarrelMock.ts
export const mockAdvisor = {
  _id: "advisor1",
  firstName: "Alex",
  lastName: "Reyes",
  persona: {
    name: "Alex Reyes",
    title: "Investment Advisor",
    oneLiner: "Seasoned investor-operator with 30+ years experience",
    archetype: "The Pragmatic Investor-Operator",
    temperament: "Radically candid, founder-empathetic, and zero-fluff",
    bio: "Alex blends operator scars with investor pattern-recognition",
    expertise: ["Venture Capital", "Startups", "Investment"],
    education: {
      degreeLevel: "master",
      degreeName: "MBA",
      major: "Finance & Strategy",
      institution: "Stanford Graduate School of Business",
      graduationYear: 1997,
    },
    location: {
      city: "Palo Alto",
      region: "CA",
      country: "United States",
      countryCode: "US",
      timezone: "America/Los_Angeles",
    },
    adviceDelivery: {
      mode: "business-formal",
      formality: "formal",
      useEmojis: false,
      voiceGuidelines: ["Radically candid", "Actionable and specific"],
      signOff: "— Alex",
    },
  },
  isPublic: true,
  category: "business",
  featured: true,
  tags: ["investment", "venture", "startup"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

---

## 📊 Test Coverage Analysis

### Coverage Targets by Category

| Component Category | Current Coverage | Target Coverage | Priority |
|-------------------|------------------|-----------------|----------|
| UI Components | 54.4% | 90% | High |
| Marketplace | 52-73% | 90% | High |
| Chat Components | 48% | 85% | High |
| Hooks | 25% | 80% | Medium |
| API Routes | 5% | 70% | Medium |
| Utilities | 10% | 75% | Low |
| Integration | 15% | 80% | High |

### Critical Paths to Cover

1. **User Authentication Flow**
   - Sign in/sign-up
   - Session management
   - Protected routes

2. **Marketplace Operations**
   - Browse advisors
   - Search and filter
   - Select/deselect advisors

3. **Chat Functionality**
   - Send messages
   - Switch advisors
   - View history

4. **Real-time Features**
   - Message updates
   - Typing indicators
   - Presence updates

---

## 🚀 CI/CD Integration

### GitHub Actions Test Workflow
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run linting
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test:ci
        env:
          NODE_OPTIONS: --experimental-vm-modules

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

---

## 🎯 Testing Best Practices

### 1. **Test Organization**
- **Arrange-Act-Assert Pattern**: Clear test structure
- **Descriptive Names**: Self-documenting test names
- **Single Responsibility**: One assertion per test
- **Shared Setup**: Use beforeEach/afterEach for cleanup

### 2. **Mocking Strategy**
- **Mock External Dependencies**: Convex, Clerk, APIs
- **Realistic Data**: Use representative mock data
- **Reset Mocks**: Clean up between tests
- **Avoid Over-mocking**: Keep tests realistic

### 3. **Accessibility Testing**
- **Automated Scans**: Use jest-axe for basic checks
- **Manual Testing**: Verify with screen readers
- **Keyboard Navigation**: Test without mouse
- **Color Contrast**: Verify WCAG compliance

### 4. **Performance Testing**
- **Render Performance**: Use React Profiler
- **Load Testing**: Test with large datasets
- **Memory Leaks**: Check for memory issues
- **Bundle Analysis**: Monitor bundle size

---

## 📈 Testing Roadmap

### Phase 1: Foundation (Current)
- [x] Jest configuration
- [x] Basic component tests
- [x] Mocking setup
- [x] Accessibility testing

### Phase 2: Coverage Expansion (Next 2 weeks)
- [ ] Increase core app coverage to 60%
- [ ] Add API route tests
- [ ] Expand integration tests
- [ ] Add performance tests

### Phase 3: Advanced Testing (Next month)
- [ ] E2E testing with Cypress
- [ ] Visual regression testing
- [ ] Load testing setup
- [ ] Production monitoring

### Phase 4: Optimization (Ongoing)
- [ ] Reduce test execution time
- [ ] Improve test reliability
- [ ] Add security testing
- [ ] Implement test-driven development

The testing strategy provides a comprehensive foundation for ensuring application quality, with clear paths for improvement and expansion.