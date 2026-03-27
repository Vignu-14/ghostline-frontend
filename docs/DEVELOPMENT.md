# 💻 Frontend Development Guide

Set up and develop the Ghostline frontend with React, TypeScript, and Vite.

---

## 📋 Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- **npm 9+** or **yarn/pnpm**
- **Git**
- **VS Code** (recommended)

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Vignu-14/ghostline-frontend.git
cd ghostline-frontend
```

### 2. Create `.env` File
```bash
# Environment variables for frontend
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000
```

For production, update to actual backend URLs:
```
VITE_API_BASE_URL=https://ghostline-backend-production-xxxx.up.railway.app
VITE_WS_BASE_URL=wss://ghostline-backend-production-xxxx.up.railway.app
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

Server runs at `http://localhost:5173`

---

## 🔧 Development Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run tests (if configured)
npm run test
```

---

## 📁 Project Structure

```
ghostline-frontend/
├── src/
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   ├── vite-env.d.ts              # Vite type definitions
│   ├── components/                # Reusable components
│   │   ├── ChatList.tsx
│   │   ├── PostCard.tsx
│   │   ├── UserProfile.tsx
│   │   ├── MessageInput.tsx
│   │   └── ...
│   ├── pages/                     # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   └── ...
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ChatContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ... 
│   ├── services/                  # API & external service calls
│   │   ├── api.ts                 # HTTP client setup
│   │   ├── authService.ts
│   │   ├── postService.ts
│   │   ├── chatService.ts
│   │   ├── websocketService.ts
│   │   ├── uploadService.ts
│   │   └── ...
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── ...
│   ├── types/                     # TypeScript interfaces
│   │   ├── auth.ts
│   │   ├── post.ts
│   │   ├── chat.ts
│   │   └── ...
│   ├── utils/                     # Utility functions
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── styles/                    # Global styles
│   └── assets/                    # Images, fonts, etc.
├── public/                        # Static files
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
└── package.json                   # Dependencies

```

---

## 🌐 API Integration

### Environment Variables
All API calls use `VITE_API_BASE_URL` from environment:

```typescript
// In services/api.ts
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL,
  withCredentials: true  // Include cookies for auth
});
```

### Example: Making API Calls

```typescript
// In services/authService.ts
export const login = async (username: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', {
    username,
    password
  });
  return response.data;
};

// In pages/LoginPage.tsx
const handleLogin = async (username, password) => {
  try {
    const result = await authService.login(username, password);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

---

## 🔐 Authentication Flow

### 1. Login
```typescript
// User submits login form
const { data } = await authService.login(username, password);

// Server sends JWT token in httpOnly cookie
// No need to manually store token
```

### 2. Authenticated Requests
```typescript
// JWT token automatically included in cookies
// All subsequent requests include auth
const userData = await authService.getMe();  // Uses stored cookie
```

### 3. Logout
```typescript
await authService.logout();  // Token deleted on server
```

### 4. Token Expiration
```typescript
// Token expires after 15 minutes
// After expiration, user automatically redirected to login

// Implement token refresh (optional):
const refreshToken = async () => {
  try {
    await apiClient.post('/api/auth/refresh');
  } catch (error) {
    // Redirect to login
    navigate('/login');
  }
};
```

---

## 🎨 Styling

### Tailwind CSS
All UI uses Tailwind CSS utility classes:

```typescript
// Example component
export const Button = ({ children, variant = 'primary' }) => (
  <button className={`
    px-4 py-2 rounded font-medium transition-colors
    ${variant === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
    ${variant === 'secondary' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : ''}
  `}>
    {children}
  </button>
);
```

### Global Styles
Defined in `src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
  }
}
```

---

## 🔌 WebSocket Integration

### Connection Setup
```typescript
// websocketService.ts
let socket: WebSocket | null = null;

export const connectWebSocket = (onMessage: (data: any) => void) => {
  const wsURL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';
  socket = new WebSocket(`${wsURL}/ws/chat`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement auto-reconnect
    setTimeout(connectWebSocket, 5000);
  };
};

export const sendMessage = (receiverId: string, content: string) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'message',
      receiver_id: receiverId,
      content
    }));
  }
};
```

### Using in Components
```typescript
// ChatPage.tsx
const ChatPage = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    websocketService.connectWebSocket((data) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, data]);
      }
    });

    return () => websocketService.closeWebSocket();
  }, []);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
};
```

---

## 📦 State Management

### Context API
For simple global state:

```typescript
// context/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// App.tsx
<AuthProvider>
  <ChatProvider>
    <App />
  </ChatProvider>
</AuthProvider>
```

### Hook Usage
```typescript
// In any component
const { user, logout } = useAuth();
const { messages, sendMessage } = useChat();
```

---

## 🧩 Component Best Practices

### Functional Components with Hooks
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
  >
    {label}
  </button>
);
```

### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}

// Wrap pages
<ErrorBoundary>
  <ChatPage />
</ErrorBoundary>
```

---

## 🧪 Testing

### Component Testing Example
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## 🛠️ Common Development Tasks

### Add New Page
1. Create file in `src/pages/NewPage.tsx`
2. Add route in `App.tsx`
3. Add navigation link

```typescript
// App.tsx
<Routes>
  <Route path="/newpage" element={<NewPage />} />
</Routes>
```

### Add New Component
1. Create file in `src/components/NewComponent.tsx`
2. Define TypeScript interface
3. Export component

```typescript
interface NewComponentProps {
  title: string;
  onClose: () => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({ title, onClose }) => (
  <div>{title}</div>
);
```

### Add New API Service
1. Create file in `src/services/newService.ts`
2. Use apiClient for requests
3. Export functions

```typescript
export const getNewData = async (id: string) => {
  const response = await apiClient.get(`/api/new/${id}`);
  return response.data;
};
```

---

## 📝 TypeScript Tips

### Define API Response Types
```typescript
// types/api.ts
export interface LoginResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}
```

### Type Services
```typescript
export const login = async (
  username: string, 
  password: string
): Promise<LoginResponse> => {
  const response = await apiClient.post('/api/auth/login', {
    username,
    password
  });
  return response.data;
};
```

---

## 🐛 Debugging

### Chrome DevTools
1. Open DevTools: `F12`
2. Go to **React** tab (if React DevTools installed)
3. Inspect components, see props/state
4. Use **Network** tab to see API requests/responses
5. Use **Console** tab for error logs

### VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

### Console Logging
```typescript
console.log('User:', user);      // Display object
console.table(messages);          // Display as table
console.time('api');              // Start timer
// ... code ...
console.timeEnd('api');           // End timer, show duration
console.error('Error message');   // Red error log
```

---

## 📚 Useful Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

---

## 🆘 Common Issues

### Port Already in Use
```bash
# Frontend runs on 5173 by default
# Change in vite.config.ts:
export default defineConfig({
  server: {
    port: 3001  // Different port
  }
});
```

### Environment Variables Not Loading
```bash
# Must start with VITE_ prefix
# VITE_API_BASE_URL=...   ✅ Works
# API_BASE_URL=...        ❌ Won't work

# Hard refresh to load changes
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

### Build Fails with TypeScript Errors
```bash
# Check types
npm run type-check

# Fix errors before building
npm run build
```

---

See also: [DEPLOYMENT.md](./DEPLOYMENT.md), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
