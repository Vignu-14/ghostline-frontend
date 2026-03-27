# 🏗️ Frontend Architecture

Technical architecture and design patterns for Ghostline Frontend.

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Client                          │
├─────────────────────────────────────────────────────────────┤
│  React App (Vite)                                            │
│  ├── Pages (HomePage, ChatPage, LoginPage, etc.)           │
│  ├── Components (Reusable UI pieces)                        │
│  ├── Context (Auth, Chat, Notifications)                   │
│  ├── Services (API, WebSocket, Upload)                     │
│  └── Hooks (Custom React hooks)                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Network Layer                             │
├─────────────────────────────────────────────────────────────┤
│  HTTP/REST (API calls)                                      │
│  WebSocket (Real-time messaging)                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              Backend (Go + Fiber Framework)                 │
│  (Hosted on Railway)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── ChatProvider (Context)
│       └── Routes
│           ├── LoginPage
│           │   └── LoginForm
│           ├── RegisterPage
│           │   └── RegisterForm
│           ├── HomePage
│           │   ├── FeedSection
│           │   │   └── PostCard[]
│           │   └── SidebarNav
│           ├── ChatPage
│           │   ├── ChatList
│           │   │   └── ChatListItem[]
│           │   ├── MessagePanel
│           │   │   ├── MessageList
│           │   │   │   └── MessageBubble[]
│           │   │   └── MessageInput
│           │   └── UserInfo
│           ├── ProfilePage
│           │   ├── ProfileHeader
│           │   ├── UserStats
│           │   └── UserPosts[]
│           └── AdminPage
│               ├── UserManagement
│               ├── PostsManagement
│               └── SystemStats
```

---

## 🔐 Authentication Flow

```
User Input
    ↓
LoginForm Component
    ↓
authService.login(username, password)
    ↓
POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Returns JWT token in httpOnly Cookie
    ↓
Frontend stores user in AuthContext
    ↓
Protected routes now accessible
```

### Auth Context
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
```

---

## 💬 Real-time Chat Flow

```
User A sends message
    ↓
MessageInput.tsx captures input
    ↓
websocketService.sendMessage()
    ↓
WebSocket sends to Backend
    ↓
Backend validates & saves to DB
    ↓
Backend broadcasts to User B
    ↓
User B receives via WebSocket
    ↓
ChatContext updates messages
    ↓
MessageList re-renders with new message
```

### WebSocket Message Format
```json
// Client → Server
{
  "type": "message",
  "receiver_id": "user-uuid",
  "content": "Hello!"
}

// Server → Client
{
  "type": "message",
  "id": "msg-uuid",
  "sender_id": "user-uuid",
  "receiver_id": "your-uuid",
  "content": "Hello!",
  "is_read": false,
  "created_at": "2026-03-28T10:00:00Z"
}
```

---

## 📲 State Management

### Context API Structure
```
AuthContext
├── user: { id, username, email, role }
├── isAuthenticated: boolean
└── login/logout/register methods

ChatContext
├── conversations: Chat[]
├── selectedChat: Chat | null
├── messages: Message[]
└── sendMessage method

NotificationContext
├── notifications: Notification[]
└── addNotification method

ThemeContext
├── isDark: boolean
└── toggleTheme method
```

### Data Flow
```
Component needs data
    ↓
useAuth() / useChat() hook
    ↓
Accesses Context
    ↓
Triggers re-render on state change
    ↓
Component updates automatically
```

---

## 🔌 API Client Architecture

```typescript
// services/api.ts
const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  withCredentials: true  // Include cookies
});

// Interceptors for auth & error handling
apiClient.interceptors.request.use(config => {
  // Add auth header if needed
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📄 Page Architecture

### HomePage
```
HomePage
├── FeedSection
│   ├── PostCreation Card (if auth)
│   └── PostCard[] (from API)
├── SidebarNav
│   ├── Profile Link
│   ├── Chat Link
│   ├── Admin Link (if admin)
│   └── Logout Button
└── Pagination / Infinite Scroll
```

### ChatPage
```
ChatPage
├── ChatList
│   ├── Search Bar
│   └── ChatListItem[] (conversations)
├── MessagePanel
│   ├── MessageList
│   │   └── MessageBubble[] (grouped by date)
│   └── MessageInput
│       └── Send Button
└── UserInfo (selected chat user)
```

### ProfilePage
```
ProfilePage
├── ProfileHeader
│   ├── Avatar
│   ├── Username
│   ├── Bio
│   └── Edit Button (if own profile)
├── UserStats
│   ├── Follower Count
│   ├── Post Count
│   └── Join Date
└── UserPosts (paginated feed)
```

---

## 🎨 Styling Architecture

### Tailwind CSS Strategy
```
Global Styles (globals.css)
├── Tailwind base/components/utilities
├── Custom color palette
└── Typography defaults

Component Styles
├── Inline Tailwind classes in JSX
├── Tailwind @layer for reusable patterns
└── CSS Modules for complex styles

Responsive Design
├── Mobile-first approach
├── sm: md: lg: xl: 2xl: breakpoints
└── Flexbox & Grid for layouts
```

### Color System
```
Primary: Blue (500, 600, 700)
Secondary: Gray (200, 300, 400)
Success: Green (500, 600)
Error: Red (500, 600)
Warning: Orange (500, 600)
Background: White / Gray-50 (light), Gray-900 (dark)
```

---

## 🎯 Routing Structure

```
/                    → HomePage
/login               → LoginPage
/register            → RegisterPage
/chat                → ChatPage
/profile/:userId     → ProfilePage
/admin               → AdminPage (admin only)
/settings            → SettingsPage
/not-found           → 404
```

### Protected Routes
```typescript
const ProtectedRoute = ({ component: Component }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? (
    <Component />
  ) : (
    <Navigate to="/login" replace />
  );
};
```

---

## 📤 File Upload Architecture

```
User selects file
    ↓
Validate (type, size)
    ↓
uploadService.requestSignedURL()
    ↓
POST /api/posts/upload-url → Get signed URL
    ↓
uploadService.uploadToSupabase(signedURL, file)
    ↓
PUT to signed URL
    ↓
uploadService.finalizeUpload()
    ↓
POST /api/posts/finalize → Create post with file reference
    ↓
Post appears in feed
```

---

## 🔄 Data Flow Examples

### Login Flow
```
LoginForm input
    ↓
authService.login(username, password)
    ↓
axios.post('/api/auth/login')
    ↓
Backend responds with JWT in cookie
    ↓
AuthContext sets user state
    ↓
AuthProvider updates isAuthenticated
    ↓
Protected routes become accessible
    ↓
Navigate to HomePage
```

### Post Creation Flow
```
User types caption + selects image
    ↓
Get signed upload URL
    ↓
Upload image to Supabase Storage
    ↓
Finalize post on backend
    ↓
Backend saves post metadata to DB
    ↓
Post appears in feed (via API refetch)
    ↓
Show success notification
```

### Message Reception Flow
```
WebSocket message event
    ↓
Parse JSON from server
    ↓
ChatContext receives message
    ↓
Add to messages array
    ↓
MessageList component re-renders
    ↓
New message appears in chat
    ↓
Mark as read if viewing conversation
```

---

## 🎯 Performance Optimizations

### Code Splitting
```typescript
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Lazy load routes
<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/chat" element={<ChatPage />} />
  </Routes>
</Suspense>
```

### Memoization
```typescript
import { memo } from 'react';

// Prevent re-renders of expensive components
const MessageBubble = memo(({ message }) => (
  <div>{message.content}</div>
));
```

### Infinite Scroll
```typescript
// Load posts progressively
const [posts, setPosts] = useState([]);
const [page, setPage] = useState(1);

const loadMore = () => {
  fetchPosts(page).then(newPosts => {
    setPosts(prev => [...prev, ...newPosts]);
    setPage(prev => prev + 1);
  });
};
```

---

## 🔐 Security Implementation

### XSS Prevention
- Sanitize user input before display
- Use React's built-in JSX escaping
- Never use `dangerouslySetInnerHTML`

### CSRF Protection
- Backend enforces SameSite=Strict cookies
- Frontend doesn't need explicit CSRF tokens

### Auth Token Management
- JWT stored in httpOnly cookie (safe from JS)
- No localStorage for sensitive tokens
- Automatic inclusion in requests via credentials

---

## 📊 Error Handling

### API Error Handling
```typescript
try {
  const data = await authService.login(username, password);
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid credentials
  } else if (error.response?.status === 500) {
    // Server error
  } else {
    // Network error
  }
}
```

### Component Error Boundaries
```typescript
<ErrorBoundary>
  <ChatPage />
</ErrorBoundary>
```

---

## 📱 Responsive Design

### Breakpoints
```
xs: 0px    (mobile)
sm: 640px  (mobile landscape)
md: 768px  (tablet)
lg: 1024px (desktop)
xl: 1280px (large desktop)
```

### Example
```typescript
<div className="
  grid grid-cols-1    // Mobile: 1 column
           md:grid-cols-2  // Tablet: 2 columns
           lg:grid-cols-3  // Desktop: 3 columns
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## 🔄 Async Operations

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleFetch = async () => {
  setLoading(true);
  try {
    const data = await fetchData();
  } finally {
    setLoading(false);
  }
};
```

### useEffect Cleanup
```typescript
useEffect(() => {
  const subscription = eventEmitter.subscribe();
  
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

---

See also: [DEVELOPMENT.md](./DEVELOPMENT.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
