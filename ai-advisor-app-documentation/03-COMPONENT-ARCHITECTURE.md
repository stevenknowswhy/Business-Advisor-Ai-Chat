# AI Advisor Chat - Component Architecture

## 🏗️ Component Overview

The application follows a modular component architecture with clear separation of concerns, accessibility-first design, and real-time data integration.

---

## 📁 Component Structure

```
src/components/
├── chat/                    # Chat functionality components
│   ├── ChatInterface.tsx   # Main chat interface container
│   ├── AdvisorRail.tsx     # Sidebar with advisors and conversations
│   ├── MessageList.tsx     # Message display and interaction
│   ├── MessageInput.tsx    # Message composition and sending
│   ├── ConversationHeader.tsx # Chat header with advisor info
│   ├── MessageActions.tsx  # Message edit/delete actions
│   ├── TypingIndicator.tsx # Real-time typing status
│   ├── Feedback.tsx        # Message feedback system
│   ├── DeleteConversationDialog.tsx # Conversation deletion
│   └── AdvisorModal.tsx    # Advisor creation/editing modal
├── marketplace/            # Marketplace functionality
│   ├── MarketplaceLayout.tsx # Main marketplace layout
│   ├── components/         # Reusable marketplace components
│   │   ├── AdvisorCard.tsx  # Individual advisor display
│   │   ├── AdvisorGrid.tsx  # Grid layout for advisors
│   │   ├── SearchAndFilters.tsx # Search and filtering UI
│   │   └── CategoryFilter.tsx # Category-based filtering
│   └── pages/              # Marketplace tab pages
│       ├── MarketplaceTab.tsx # Main marketplace view
│       └── MyAdvisorsTab.tsx # User's selected advisors
├── advisors/               # Advisor management
│   └── TeamCreatorWithDesignSystem.tsx # Team creation interface
└── ui/                     # Reusable UI components
    ├── Button.tsx          # Accessible button component
    ├── Card.tsx            # Card container component
    ├── Badge.tsx           # Badge display component
    ├── LoadingSpinner.tsx  # Loading indicator
    ├── Modal.tsx           # Modal dialog component
    ├── SearchInput.tsx     # Search input field
    ├── FilterDropdown.tsx  # Filter dropdown component
    ├── HamburgerMenu.tsx   # Mobile navigation menu
    ├── Tooltip.tsx         # Tooltip component
    └── TooltipContent.tsx   # Tooltip content wrapper
```

---

## 🎯 Core Components

### 1. **ChatInterface.tsx** - Main Application Container

**Purpose**: Root component that orchestrates the entire chat application

**Key Responsibilities**:
- Authentication state management
- Data loading and state synchronization
- Advisor and conversation management
- Error handling and user feedback
- Mobile/desktop responsive layout

**Key Features**:
```typescript
// State Management
const [advisors, setAdvisors] = useState<Advisor[]>([]);
const [conversations, setConversations] = useState<Conversation[]>([]);
const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

// Real-time Data Integration
const { messages, input, handleSubmit, switchAdvisor } = useAdvisorChat(currentConversation?.id);

// Event Handlers
const handleNewConversation = async () => { /* ... */ };
const handleConversationSelect = async (conversationId: string) => { /* ... */ };
const handleDeleteConversation = async (conversationId: string) => { /* ... */ };
```

**Accessibility**:
- ARIA landmarks for main application regions
- Keyboard navigation support
- Screen reader announcements for state changes
- Focus management for modal interactions

### 2. **AdvisorRail.tsx** - Sidebar Navigation

**Purpose**: Left sidebar for advisor selection and conversation management

**Key Responsibilities**:
- Display user's selected advisors
- Show conversation history
- Handle advisor switching
- Provide marketplace access
- Mobile-responsive behavior

**Component Structure**:
```typescript
interface AdvisorRailProps {
  advisors: Advisor[];
  conversations: Conversation[];
  activeAdvisorId: string;
  currentConversationId: string;
  onAdvisorSelect: (advisorId: string) => void;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  isCollapsed: boolean;
}
```

**Features**:
- Collapsible design with hamburger menu
- Avatar display with advisor initials
- Conversation list with timestamps
- New conversation button
- Marketplace access button
- Tooltips for collapsed state

### 3. **MessageList.tsx** - Message Display

**Purpose**: Display and manage chat messages with real-time updates

**Key Responsibilities**:
- Render messages with proper styling
- Handle message editing and deletion
- Display advisor information
- Show typing indicators
- Manage message actions

**Message Rendering**:
```typescript
const MessageBubble = ({ message, advisor }) => (
  <div className={`message-bubble ${message.sender === 'user' ? 'user' : 'advisor'}`}>
    <div className="message-avatar">
      {advisor && <Avatar advisor={advisor} />}
    </div>
    <div className="message-content">
      <div className="message-text">{message.content}</div>
      <div className="message-meta">
        <span className="message-time">{formatTime(message.createdAt)}</span>
        <MessageActions message={message} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  </div>
);
```

**Accessibility**:
- Semantic HTML structure
- ARIA labels for message actions
- Keyboard navigation for message actions
- Screen reader friendly message announcements

### 4. **MessageInput.tsx** - Message Composition

**Purpose**: Handle message composition and submission

**Key Responsibilities**:
- Text input with validation
- Message submission handling
- Advisor mention detection
- Character count and formatting
- Submit button state management

**Features**:
```typescript
const MessageInput = ({ input, handleInputChange, handleSubmit, isLoading, advisors }) => {
  const [mentionSuggestions, setMentionSuggestions] = useState<Advisor[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Detect @mentions and show suggestions
    const mentions = detectMentions(value, advisors);
    setMentionSuggestions(mentions);
  };

  return (
    <div className="message-input-container">
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder="Message your advisor..."
        className="message-input"
        aria-label="Message input"
      />
      {mentionSuggestions.length > 0 && (
        <MentionSuggestions suggestions={mentionSuggestions} />
      )}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
        className="send-button"
      >
        Send
      </button>
    </div>
  );
};
```

---

## 🛍️ Marketplace Components

### 1. **MarketplaceLayout.tsx** - Marketplace Container

**Purpose**: Main layout component for the advisor marketplace

**Key Responsibilities**:
- Tab navigation (Marketplace/My Advisors)
- Search and filtering integration
- Responsive layout management
- State coordination between tabs

**Structure**:
```typescript
const MarketplaceLayout = ({ children, initialTab = 'marketplace' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="marketplace-layout">
      <div className="marketplace-header">
        <h1>Advisor Marketplace</h1>
        <SearchAndFilters
          onSearch={setSearchQuery}
          onCategoryChange={setSelectedCategory}
        />
      </div>
      <div className="marketplace-tabs">
        <TabButton
          active={activeTab === 'marketplace'}
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </TabButton>
        <TabButton
          active={activeTab === 'my-advisors'}
          onClick={() => setActiveTab('my-advisors')}
        >
          My Advisors
        </TabButton>
      </div>
      <div className="marketplace-content">
        {children}
      </div>
    </div>
  );
};
```

### 2. **AdvisorCard.tsx** - Individual Advisor Display

**Purpose**: Display individual advisor information in the marketplace

**Key Responsibilities**:
- Show advisor profile information
- Display advisor expertise and specialties
- Handle advisor selection
- Show advisor ratings and reviews

**Component Structure**:
```typescript
interface AdvisorCardProps {
  advisor: Advisor;
  isSelected: boolean;
  onSelect: (advisorId: string) => void;
  onDeselect: (advisorId: string) => void;
}

const AdvisorCard = ({ advisor, isSelected, onSelect, onDeselect }) => {
  return (
    <div className={`advisor-card ${isSelected ? 'selected' : ''}`}>
      <div className="advisor-header">
        <Avatar advisor={advisor} size="large" />
        <div className="advisor-info">
          <h3 className="advisor-name">{advisor.persona.name}</h3>
          <p className="advisor-title">{advisor.persona.title}</p>
        </div>
      </div>
      <div className="advisor-description">
        <p>{advisor.persona.oneLiner}</p>
      </div>
      <div className="advisor-expertise">
        {advisor.persona.expertise?.slice(0, 3).map(skill => (
          <Badge key={skill} text={skill} />
        ))}
      </div>
      <div className="advisor-actions">
        {isSelected ? (
          <Button onClick={() => onDeselect(advisor.id)} variant="secondary">
            Remove
          </Button>
        ) : (
          <Button onClick={() => onSelect(advisor.id)} variant="primary">
            Add to Board
          </Button>
        )}
      </div>
    </div>
  );
};
```

### 3. **SearchAndFilters.tsx** - Search and Filtering

**Purpose**: Handle marketplace search and filtering functionality

**Key Responsibilities**:
- Text search with debouncing
- Category filtering
- Advanced filter options
- Search result display

**Implementation**:
```typescript
const SearchAndFilters = ({ onSearch, onCategoryChange, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const debouncedSearch = useDebounce((term: string) => {
    onSearch(term);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  return (
    <div className="search-and-filters">
      <div className="search-container">
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search advisors..."
        />
      </div>
      <div className="filters-container">
        <FilterDropdown
          options={categories}
          selected={selectedCategory}
          onChange={(category) => {
            setSelectedCategory(category);
            onCategoryChange(category);
          }}
        />
      </div>
    </div>
  );
};
```

---

## 🎨 UI Component System

### 1. **Button.tsx** - Accessible Button Component

**Purpose**: Reusable, accessible button component

**Features**:
- Multiple variants (primary, secondary, ghost)
- Loading states
- Accessibility attributes
- Responsive sizing

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  ariaLabel
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
};
```

### 2. **Modal.tsx** - Accessible Modal Dialog

**Purpose**: Reusable modal component with accessibility features

**Features**:
- Keyboard navigation support
- Focus trapping
- ARIA attributes
- Backdrop click handling
- Screen reader announcements

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus trapping
      trapFocus(modalRef.current);
      // Announce to screen readers
      announceToScreenReader(`Modal opened: ${title}`);
    }
  }, [isOpen, title]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal-${size}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 3. **LoadingSpinner.tsx** - Loading Indicator

**Purpose**: Accessible loading spinner component

**Features**:
- Multiple sizes
- Accessibility attributes
- Customizable colors
- Screen reader support

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner = ({ size = 'md', color = 'currentColor', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={`loading-spinner ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-25"
        />
        <path
          fill="currentColor"
          className="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};
```

---

## 🔧 State Management Architecture

### 1. **Custom Hooks** - Business Logic Encapsulation

```typescript
// useAdvisorChat.ts - Core chat functionality
export const useAdvisorChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAdvisorId, setActiveAdvisorId] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    // Handle message submission with real-time streaming
  };

  const switchAdvisor = (advisorId: string) => {
    // Handle advisor switching
  };

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    activeAdvisorId,
    switchAdvisor,
    setMessages
  };
};

// useMarketplace.ts - Marketplace functionality
export const useMarketplace = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
  const [filters, setFilters] = useState<MarketplaceFilters>({});

  const searchAdvisors = async (query: string) => {
    // Handle advisor search
  };

  const selectAdvisor = (advisorId: string) => {
    // Handle advisor selection
  };

  return {
    advisors,
    selectedAdvisors,
    filters,
    searchAdvisors,
    selectAdvisor
  };
};
```

### 2. **Context Providers** - Global State Management

```typescript
// SidebarContext.tsx - Sidebar state management
interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapse: () => {},
  toggleMobile: () => {},
  closeMobileSidebar: () => {}
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isMobileOpen,
      toggleCollapse,
      toggleMobile,
      closeMobileSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
```

---

## ♿ Accessibility Architecture

### 1. **Accessibility Standards**
- **WCAG 2.1 AA**: Full compliance with accessibility guidelines
- **Screen Reader Support**: Comprehensive ARIA attributes
- **Keyboard Navigation**: Complete keyboard accessibility
- **Focus Management**: Proper focus indicators and tab order

### 2. **Accessibility Features**

#### **Form Accessibility**
```typescript
const AccessibleInput = ({ label, error, ...props }) => (
  <div className="form-group">
    <label htmlFor={props.id} className="form-label">
      {label}
      {props.required && <span className="required" aria-label="required">*</span>}
    </label>
    <input
      {...props}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : undefined}
      className={`form-input ${error ? 'error' : ''}`}
    />
    {error && (
      <div id={`${props.id}-error`} className="error-message" role="alert">
        {error}
      </div>
    )}
  </div>
);
```

#### **Button Accessibility**
```typescript
const AccessibleButton = ({ children, isLoading, ...props }) => (
  <button
    {...props}
    aria-busy={isLoading}
    disabled={props.disabled || isLoading}
    className={`btn ${props.className || ''}`}
  >
    {isLoading ? (
      <>
        <LoadingSpinner size="sm" />
        <span className="sr-only">Loading</span>
      </>
    ) : children}
  </button>
);
```

#### **Modal Accessibility**
```typescript
const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Trap focus within modal
      trapFocus(modalRef.current);
      // Announce to screen readers
      announceToScreenReader(`Modal opened: ${title}`);
    }
  }, [isOpen, title]);

  return (
    isOpen && (
      <div className="modal-overlay" onClick={onClose}>
        <div
          ref={modalRef}
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="modal-close"
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    )
  );
};
```

---

## 🔄 Data Flow Architecture

### 1. **Real-time Data Flow**
```
User Action → React Component → Convex Mutation → Convex Database → Live Query → UI Update
```

### 2. **State Management Flow**
```
User Input → Component State → Context Provider → Custom Hook → Convex Query → Database
```

### 3. **AI Integration Flow**
```
User Message → API Route → Convex Function → OpenRouter API → AI Response → Stream to UI
```

---

## 📱 Responsive Architecture

### 1. **Breakpoint System**
```css
/* Mobile: 0-768px */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.mobile-open { transform: translateX(0); }
}

/* Tablet: 769-1024px */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar { width: 60px; }
  .sidebar.expanded { width: 240px; }
}

/* Desktop: 1025px+ */
@media (min-width: 1025px) {
  .sidebar { width: 240px; }
  .sidebar.collapsed { width: 60px; }
}
```

### 2. **Responsive Components**
```typescript
const ResponsiveContainer = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`responsive-container ${isMobile ? 'mobile' : 'desktop'}`}>
      {children}
    </div>
  );
};
```

---

## 🎯 Component Best Practices

### 1. **Single Responsibility**
- Each component has a single, well-defined purpose
- Business logic is encapsulated in custom hooks
- Presentation components are separated from container components

### 2. **Accessibility First**
- All components are built with accessibility in mind
- ARIA attributes are used consistently
- Keyboard navigation is supported throughout

### 3. **Performance Optimized**
- Components are memoized where appropriate
- Expensive calculations are memoized
- Real-time updates are optimized with Convex

### 4. **TypeScript Integration**
- All components have proper TypeScript interfaces
- Props are strictly typed
- Generic types are used where appropriate

### 5. **Testing Strategy**
- Components are unit tested with Jest
- Integration tests verify component interactions
- Accessibility tests ensure WCAG compliance

The component architecture demonstrates modern React best practices with a focus on accessibility, real-time functionality, and maintainable code structure.