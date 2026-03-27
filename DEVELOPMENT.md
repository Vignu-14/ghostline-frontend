# 🛠️ Frontend Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git
- Code editor (VS Code recommended)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/your-org/ghostline-frontend
cd ghostline-frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your API URL
# VITE_API_BASE_URL=http://localhost:8080

# Start development server
npm run dev

# Open http://localhost:5173 in browser
```

---

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── vite-env.d.ts              # Vite type definitions
│   │
│   ├── pages/                      # Route pages (one per major view)
│   │   ├── HomePage.tsx           # Feed, discover posts
│   │   ├── LoginPage.tsx          # Login form
│   │   ├── RegisterPage.tsx       # Registration form
│   │   ├── ChatPage.tsx           # Messaging interface
│   │   ├── ProfilePage.tsx        # User profile
│   │   ├── AdminPage.tsx          # Admin dashboard
│   │   └── NotFoundPage.tsx       # 404 page
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Navbar.tsx             # Top navigation
│   │   ├── PostFeed.tsx           # List of posts
│   │   ├── PostCard.tsx           # Single post display
│   │   ├── ChatWindow.tsx         # Chat conversation
│   │   ├── ChatList.tsx           # List of conversations
│   │   ├── ProtectedRoute.tsx     # Auth guard wrapper
│   │   ├── UserSearchPanel.tsx    # User search
│   │   ├── ProfileCard.tsx        # User profile card
│   │   └── LoadingSpinner.tsx     # Loading indicator
│   │
│   ├── context/                    # Global state management
│   │   ├── AuthContext.tsx        # Authentication state
│   │   │   ├─ currentUser
│   │   │   ├─ isLoggedIn
│   │   │   ├─ login()
│   │   │   └─ logout()
│   │   ├── ChatContext.tsx        # Chat state
│   │   │   ├─ conversations
│   │   │   ├─ selectedChat
│   │   │   ├─ messages
│   │   │   └─ sendMessage()
│   │   └── NotificationContext.tsx # Toast notifications
│   │       ├─ notifications
│   │       ├─ showNotification()
│   │       └─ clearNotification()
│   │
│   ├── services/                   # API calls and external services
│   │   ├── api.ts                 # HTTP client setup
│   │   ├── authService.ts         # Login, register, logout
│   │   ├── postService.ts         # Post CRUD operations
│   │   ├── chatService.ts         # Message CRUD operations
│   │   ├── userService.ts         # User profile operations
│   │   ├── uploadService.ts       # File uploads
│   │   └── webSocketService.ts    # Real-time chat connection
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts             # Access auth context
│   │   ├── useChat.ts             # Access chat context
│   │   ├── useNotification.ts     # Show toast notifications
│   │   ├── useFetch.ts            # Data fetching with loading state
│   │   └── useWindowSize.ts       # Responsive design
│   │
│   ├── types/                      # TypeScript interfaces
│   │   ├── User.ts                # User interface
│   │   ├── Post.ts                # Post interface
│   │   ├── Message.ts             # Message interface
│   │   ├── Chat.ts                # Chat/Conversation interface
│   │   └── Api.ts                 # API response types
│   │
│   ├── utils/                      # Utility functions
│   │   ├── formatters.ts          # Date, time, number formatting
│   │   ├── validators.ts          # Form validation
│   │   ├── constants.ts           # App-wide constants
│   │   └── storageHelper.ts       # localStorage wrapper
│   │
│   ├── styles/                     # Global styles
│   │   └── globals.css            # Tailwind imports, global styles
│   │
│   └── assets/                     # Images, icons
│       ├── logo.svg
│       └── images/
│
├── public/                         # Static files (not processed)
│   ├── index.html
│   ├── manifest.json
│   ├── robots.txt
│   └── assets/
│       └── favicon.ico
│
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration (Tailwind)
├── eslint.config.js               # ESLint rules
├── package.json                   # Dependencies & scripts
├── .env.example                   # Environment variable template
└── README.md                       # Project documentation
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/add-image-upload
```

### 2. Make Changes

**Example: Add Image Upload to Posts**

**1. Create type:**
```typescript
// src/types/Post.ts
export interface CreatePostRequest {
  caption: string;
  imageUrl?: string;  // Add image field
}
```

**2. Create form component:**
```typescript
// src/components/CreatePostForm.tsx
import { useState } from 'react';
import { postService } from '../services/postService';

export function CreatePostForm() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl: string | undefined;
    
    // Upload image if provided
    if (image) {
      try {
        imageUrl = await postService.uploadImage(image);
      } catch (error) {
        console.error('Image upload failed:', error);
        return;
      }
    }

    // Create post
    try {
      await postService.createPost({
        caption,
        imageUrl,
      });
      setCaption('');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What's on your mind?"
        required
        className="w-full p-2 border rounded mb-2"
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-2"
      />
      
      {image && <p className="text-sm text-gray-600">{image.name}</p>}
      
      <button
        type="submit"
        disabled={loading || !caption.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
```

**3. Add service method:**
```typescript
// src/services/postService.ts
export async function uploadImage(file: File): Promise<string> {
  // Get signed upload URL from backend
  const response = await fetch(`${API_BASE_URL}/api/posts/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
    }),
    credentials: 'include',
  });

  const { data } = await response.json();
  const { upload_url, object_path } = data;

  // Upload to Supabase
  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Upload failed');
  }

  return object_path;
}
```

### 3. Test Locally

```bash
npm run dev
# Test at http://localhost:5173
```

### 4. Build and Preview

```bash
npm run build
npm run preview
# Test production build
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: add image upload to posts"
git push origin feature/add-image-upload
```

### 6. Create Pull Request

On GitHub:
1. Click "Compare & pull request"
2. Add description of changes
3. Request reviewer
4. Address feedback
5. Merge when approved

---

## Key Technologies

### React 19

Latest React with hooks and concurrent features.

```typescript
// Component with hooks
function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </>
  );
}
```

### TypeScript

Type-safe JavaScript with interfaces and generics.

```typescript
interface User {
  id: string;
  username: string;
  email: string;
}

function renderUser(user: User): JSX.Element {
  return <h1>{user.username}</h1>;
}
```

### Vite

Fast build tool for modern web development.

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Tailwind CSS

Utility-first CSS framework.

```html
<!-- Build UI with utility classes -->
<div class="flex items-center justify-between p-4 bg-gray-100 rounded">
  <h1 class="text-2xl font-bold text-gray-900">Title</h1>
  <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
    Click me
  </button>
</div>
```

### React Router

Client-side routing for single-page app.

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Common Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173

# Building
npm run build        # Production build to dist/
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Check for code style issues
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Test UI (Vitest)

# Cleaning
npm run clean        # Remove build artifacts
rm -rf node_modules  # Remove dependencies (reinstall with npm install)

# Dependencies
npm install          # Install all dependencies
npm update           # Update to latest compatible versions
npm audit            # Check for security vulnerabilities
npm audit fix        # Auto-fix security issues
```

---

## Environment Variables

Create `.env` in project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=true

# App Constants
VITE_APP_NAME=Ghostline
VITE_APP_VERSION=1.0.0
```

**Note:** Variables must be prefixed with `VITE_` to be accessible in frontend.

---

## Performance Tips

### Code Splitting

Lazy load routes to reduce initial bundle size:

```typescript
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

Use proper image formats and sizes:

```typescript
// ✅ Good
<img
  src="user-avatar.webp"
  alt="User avatar"
  width={40}
  height={40}
  loading="lazy"
/>

// ❌ Bad
<img src="large-high-res-image.png" />
```

### Memoization

Prevent unnecessary re-renders:

```typescript
import { memo } from 'react';

// Component only re-renders if props change
const PostCard = memo(function PostCard({ post }) {
  return <div>{post.caption}</div>;
});
```

### Bundle Analysis

Check bundle size:

```bash
npm install --save-dev @vite/plugin-visualizer
```

Then update `vite.config.ts` and run build.

---

## Debugging Tips

### DevTools

**Browser DevTools (F12):**
- Console: See JavaScript errors
- Network: Monitor API requests
- Application: View cookies, localStorage
- Elements: Inspect HTML structure

### React DevTools

Install React DevTools extension:
- See component tree
- Inspect props and state
- Profile performance

### VS Code Debugging

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### Console Logging

```typescript
console.log('Variable:', variable);
console.error('Error:', error);
console.table(arrayOfObjects);  // Display as table
console.time('myFunction');
myFunction();
console.timeEnd('myFunction');   // Log execution time
```

---

## Code Style

Follow the project's ESLint rules:

```typescript
// ✅ Good
interface User {
  id: string;
  username: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ Bad
interface user {id:string,username:string}
function fetchUser(id){return fetch(`/api/users/${id}`).then(r=>r.json())}
```

---

## Testing

### Unit Tests

Test individual components and functions:

```typescript
import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';

describe('PostCard', () => {
  it('renders post caption', () => {
    const post = {
      id: '1',
      caption: 'Hello world',
      imageUrl: 'https://example.com/image.jpg',
      likeCount: 0,
      isLikedByUser: false,
      createdAt: new Date().toISOString(),
    };

    render(<PostCard post={post} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

Run tests:
```bash
npm test
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report
```

---

## Deployment

### Build for Production

```bash
npm run build
# Creates dist/ directory with optimized files
```

### Deploy to Vercel

1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Set `VITE_API_BASE_URL` environment variable
5. Vercel auto-deploys on push

---

Last Updated: March 28, 2026
