# 🐛 Frontend Debugging & Troubleshooting

Common frontend issues and solutions.

---

## 🔴 Build Issues

### Error: `vite: command not found`

**Solution:**
```bash
# Install dependencies first
npm install

# Then run dev
npm run dev
```

---

### Error: `Cannot find module '@/' or path is not available`

**Solution:**
Check `vite.config.ts` for alias configuration:
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

---

### Error: `TypeScript compilation errors`

**Solution:**
```bash
# Check all type errors
npm run type-check

# Fix TypeScript issues
# Most common: missing types, wrong prop types
# Add type definitions if needed:
npm install --save-dev @types/library-name
```

---

## 🟡 Runtime Issues

### Page Not Loading

**Check:**
1. **Console Errors** (F12 → Console tab)
   - Look for red error messages
   - Check for network errors

2. **Network Tab** (F12 → Network tab)
   - See all HTTP requests
   - Check status codes (200 ok, 404 not found, 500 error)
   - Look for failed requests

3. **Backend Connection**
   ```bash
   # Verify backend is running
   curl https://ghostline-backend-production-xxxx.up.railway.app/health
   ```

---

### Blank White Page

**Solution:**
```bash
# 1. Hard refresh browser
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# 2. Clear browser cache
# Chrome → Settings → Privacy → Clear browsing data

# 3. Check console for errors
F12 → Console tab

# 4. Check network requests
F12 → Network tab → Reload
```

---

### Components Not Rendering

**Check in React DevTools:**
```
F12 → React Components tab
├── Verify component is in tree
├── Check props are being passed correctly
├── Check state values
└── Look for error boundaries catching errors
```

---

## 🟡 API Connection Issues

### Error: `GET https://localhost:5173/api/... 404`

**Problem:** Frontend URL being used instead of backend URL

**Solution:**
```bash
# Check VITE_API_BASE_URL is set correctly in .env
# Should be: VITE_API_BASE_URL=https://ghostline-backend-production-xxxx.up.railway.app
# NOT: VITE_API_BASE_URL=localhost:5173

# After changing .env:
1. Stop dev server (Ctrl+C)
2. Start dev server again (npm run dev)
3. Hard refresh browser (Ctrl+Shift+R)
```

---

### Error: `No 'Access-Control-Allow-Origin' header`

**Problem:** CORS error from backend

**Solution:**
1. **Check backend ALLOWED_ORIGIN:**
   - Railway Dashboard → Variables
   - Verify it matches your frontend URL exactly
   - Should be: `https://ghostline-frontend-five.vercel.app`
   - Not: `http://`, not: with `/api` suffix

2. **Redeploy after updating:**
   - Railway → Deployments → Deploy latest

3. **Hard refresh frontend:**
   - `Ctrl+Shift+R`

---

### Error: `xhr.statusText: "Unauthorized"`

**Problem:** JWT token missing or expired

**Solution:**
```bash
# 1. Login again
# Go to /login page
# Enter credentials

# 2. Check cookie is set
# F12 → Application tab → Cookies → Check for 'auth_token'

# 3. If token still missing:
# Clear all cookies for site
# F12 → Application → Cookies → Delete all
# Then login again
```

---

### Error: `Cannot POST /api/auth/login` (404)

**Problem:** Backend not running or URL wrong

**Solution:**
```typescript
// Check backend URL in services/api.ts
const baseURL = import.meta.env.VITE_API_BASE_URL;
console.log('API Base URL:', baseURL);

// Should output: https://ghostline-backend-production-xxxx.up.railway.app
// If blank or localhost, update .env
```

---

## 🟡 WebSocket Issues

### Error: `Failed to establish WebSocket connection`

**Check:**
1. Backend is running
2. JWT token is valid (login first)
3. WebSocket URL is correct

**Solution:**
```typescript
// In websocketService.ts, add logging
console.log('Connecting to WebSocket...');
const ws = new WebSocket(wsURL);

ws.onopen = () => console.log('WebSocket connected!');
ws.onerror = (error) => console.error('WebSocket error:', error);
ws.onclose = () => console.log('WebSocket closed');
```

---

### Messages Not Sending

**Check:**
1. WebSocket is connected (`readyState === 1`)
2. Message format is correct
3. Receiver ID is valid UUID

**Solution:**
```typescript
// Verify before sending
if (socket.readyState !== WebSocket.OPEN) {
  console.error('WebSocket not connected, state:', socket.readyState);
  return;
}

// Log message being sent
console.log('Sending:', { type: 'message', receiver_id, content });

socket.send(JSON.stringify({
  type: 'message',
  receiver_id: receiverId,
  content: message
}));
```

---

### Messages Not Receiving

**Check:**
1. Sender has your user ID correct
2. WebSocket connection is alive
3. Check browser console for errors

**Solution:**
```typescript
// Add logging to message handler
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message received:', data);
  
  if (data.type === 'message') {
    // Handle message
  }
};
```

---

## 🟡 Authentication Issues

### Error: `Login button doesn't work`

**Solution:**
```bash
# 1. Check form values are being captured
# Open DevTools → Console → Type in form and check console

# 2. Check API request is sent
# F12 → Network tab → Find POST /api/auth/login
# Check Request body has username & password
# Check Response has status 200

# 3. If 401: credentials wrong
# Try different username/password

# 4. If 500: backend error
# Check Railway logs
```

---

### Error: `Logged in but pages still protected`

**Solution:**
```typescript
// Check AuthContext is properly set up
const { user, isAuthenticated } = useAuth();
console.log('User:', user);
console.log('Is Authenticated:', isAuthenticated);

// Verify protected route logic
{isAuthenticated ? <HomePage /> : <LoginPage />}
```

---

### Error: `Token expires too quickly`

**Solution:**
- Default JWT expiration is 15 minutes
- After logout and need to login again
- This is expected behavior

For longer sessions, implement token refresh:
```typescript
export const refreshToken = async () => {
  try {
    await apiClient.post('/api/auth/refresh');
    // Token extended
  } catch (error) {
    // Redirect to login
    navigate('/login');
  }
};

// Call periodically (12 minute interval)
useEffect(() => {
  const interval = setInterval(refreshToken, 12 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

---

## 🟡 UI/UX Issues

### Styling Looks Wrong

**Solution:**
```bash
# 1. Hard refresh
Ctrl+Shift+R

# 2. Clear Tailwind cache
rm -rf node_modules
npm install

# 3. Check tailwind.config.js is correct
# Should have content: ['./src/**/*.{js,ts,jsx,tsx}']

# 4. Check CSS file imported in main.tsx
# import './index.css'
```

---

### Responsive Design Not Working

**Solution:**
```typescript
// Ensure you're using Tailwind responsive prefixes
<div className="
  w-full                 // Mobile
  md:w-1/2              // Tablet
  lg:w-1/3              // Desktop
">

// Test responsiveness
F12 → Toggle device toolbar (Ctrl+Shift+M)
```

---

### Images Not Loading

**Solution:**
```typescript
// Check image URL in console
console.log('Image URL:', imageUrl);

// For Supabase images:
// URL should be: https://your-project.supabase.co/storage/v1/object/public/bucket/path

// If broken:
// 1. Check bucket exists
// 2. Check RLS policy allows public read
// 3. Check file actually exists
```

---

## 🐛 Advanced Debugging

### React DevTools
```
F12 → Components tab
├── See component tree
├── Inspect props and state
├── Trigger re-renders
└── Edit props to test
```

### Console Logging Strategy
```typescript
// Use named logs for easier identification
const DEBUG_PREFIX = '[ChatComponent]';

console.log(`${DEBUG_PREFIX} Rendering with messages:`, messages);
console.log(`${DEBUG_PREFIX} WebSocket connected: `, isConnected);
console.error(`${DEBUG_PREFIX} Error:`, error);
```

### Performance Profiling
```
F12 → Performance tab
1. Click red Record button
2. Interact with app
3. Click Record to stop
4. Analyze flame graph
5. Look for long tasks (red bars)
```

### Network Request Analysis
```
F12 → Network tab
1. Filter by: XHR (API calls)
2. Click request to see:
   - Headers: Auth tokens, CORS headers
   - Request: Data being sent
   - Response: Data received
   - Status: 200? 401? 404? 500?
```

---

## 📋 Debugging Checklist

- [ ] Backend running? (`curl /health`)
- [ ] Browser console clear? (F12 → Console)
- [ ] Network requests successful? (F12 → Network)
- [ ] Auth token present? (F12 → Application → Cookies)
- [ ] .env file correct? (`VITE_API_BASE_URL`)
- [ ] Hard refresh done? (`Ctrl+Shift+R`)
- [ ] No cached data issues? (Clear site data)
- [ ] React DevTools shows correct state? (F12 → Components)
- [ ] WebSocket connected? (check console logs)
- [ ] No CORS errors? (check Network tab)

---

## 🆘 Getting Help

1. **Check browser console** (F12)
2. **Check backend logs** (Railway Dashboard)
3. **Review Network tab** (F12 → Network)
4. **Search documentation** ([DEVELOPMENT.md](./DEVELOPMENT.md))
5. **Check API response format** (compare with [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md))

---

See also: [DEVELOPMENT.md](./DEVELOPMENT.md), [ARCHITECTURE.md](./ARCHITECTURE.md)
