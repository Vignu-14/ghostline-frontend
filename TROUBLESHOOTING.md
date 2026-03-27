# 🐛 Frontend Troubleshooting Guide

## Common Browser Issues

### Page Won't Load

**Symptoms:** Blank page, spinning logo, or "Cannot GET /"

**Debugging Steps:**

1. **Check browser console (F12)**
   ```
   Console → Look for red errors
   ```

2. **Check network errors**
   ```
   DevTools → Network tab
   - index.html should return 200
   - Check for failed requests
   - Look for CORS errors
   ```

3. **Test development server**
   ```bash
   npm run dev
   # Should show: Local: http://localhost:5173
   ```

4. **Check app logs**
   ```bash
   # Look for build errors in terminal where npm run dev runs
   # Check for TypeScript compilation errors
   ```

**Solutions:**

- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R
- Check for console errors
- Verify dev server is running

---

### API Calls Fail

**Symptoms:** "Failed to fetch", "Network error", or 0 response status

**Debugging Steps:**

```javascript
// Paste in browser console to test API:
fetch('http://localhost:8080/health')
  .then(r => r.text())
  .then(console.log)
  .catch(e => console.error('Error:', e))
```

**Solutions:**

1. **Check API_BASE_URL**
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   // Should show: http://localhost:8080
   ```

2. **Verify backend is running**
   ```bash
   curl http://localhost:8080/health
   # Should return: {"status":"ok"}
   ```

3. **Check CORS errors**
   - Console shows: `Access-Control-Allow-Origin blocked`
   - Backend CORS not configured correctly
   - Check `ALLOWED_ORIGIN` env var on backend

4. **Check API_BASE_URL format**
   - ✅ `http://localhost:8080` (no trailing slash)
   - ✅ `https://ghostline-backend.app` (https for production)
   - ❌ `http://localhost:8080/` (trailing slash)
   - ❌ `localhost:8080` (missing protocol)

---

### CORS Errors in Console

**Error:** `Access to fetch at 'http://backend.com' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Causes:**
- Backend doesn't allow requests from frontend origin
- Backend `ALLOWED_ORIGIN` misconfigured
- API endpoint doesn't set CORS headers

**Solutions:**

1. **Local development (backend running locally)**
   ```
   Backend should have: ALLOWED_ORIGIN=http://localhost:5173
   Restart backend after env var change
   ```

2. **Production deployment**
   - Verify Railway `ALLOWED_ORIGIN` matches frontend URL
   - Should be: `https://ghostline-frontend-five.vercel.app`
   - No trailing slash
   - Redeploy after change

3. **Test backend CORS**
   ```bash
   curl -H "Origin: http://localhost:5173" \
     http://localhost:8080/health
   # Should include: Access-Control-Allow-Origin: http://localhost:5173
   ```

---

## Authentication Issues

### Can't Log In

**Symptoms:** "Invalid credentials" error even with correct password, or login hangs

**Debugging Steps:**

1. **Check credentials are correct**
   - Username/email exists
   - Password has no typos
   - Test in API directly with cURL

2. **Test backend login**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"TestPass123!"}'
   ```
   - If fails with same error: backend issue
   - If succeeds: frontend issue

3. **Check browser cookies**
   - DevTools → Application → Cookies
   - Should have `auth_token` cookie after login
   - Should have `HttpOnly` flag
   - Check expiration

4. **Check authentication context**
   ```javascript
   // In browser console:
   // Open DevTools → React tab (if extension installed)
   // Look for AuthContext in component tree
   // Check currentUser value
   ```

**Solutions:**

- Verify username/password match database
- Check if account is locked (5 failed attempts)
- Clear cookies and try again
- Check backend logs for detailed error
- Verify JWT_SECRET matches between backend deployments

---

### Logged In User, But API Calls Fail

**Symptoms:** Can log in, but no posts load, or get 401 errors

**Debugging Steps:**

1. **Check auth cookie**
   ```javascript
   // In console:
   document.cookie  // Should show: auth_token=...
   ```

2. **Verify cookie is sent with requests**
   - DevTools → Network → Select POST to /api/posts
   - Headers → Request Headers
   - Should include: `cookie: auth_token=...`

3. **Check if token is expired**
   - Tokens expire after 15 minutes
   - Log out and log back in
   - Should get new token

**Solutions:**

- Ensure `credentials: 'include'` in fetch calls
- Check if token is expired (15 min timeout)
- Verify backend JWT_SECRET hasn't changed
- Check if user account was deleted
- Look for 401 errors in backend logs

---

### Keep Getting Logged Out

**Symptoms:** Have to log in again after refreshing page

**Causes:**
- Cookie not being set correctly
- Cookie being cleared on refresh
- HTTPOnly flag blocking JavaScript access
- Token expiration

**Solutions:**

1. **Check browser cookie settings**
   - DevTools → Application → Cookies
   - Max-Age should be 900 seconds (15 min)
   - Check SameSite and Secure flags

2. **Verify HTTPS in production**
   - Secure cookies only work over HTTPS
   - Frontend must use https://
   - Backend must use https://

3. **Check for automatic cookie clearing**
   - Browser privacy settings
   - Extensions blocking cookies
   - Private/Incognito mode blocks cookies

---

## Chat/WebSocket Issues

### Chat Won't Send Messages

**Symptoms:** Message hangs, shows "sending...", then fails

**Debugging Steps:**

1. **Check WebSocket connection**
   ```
   DevTools → Network → Filter by "WS"
   Should see: ws://localhost:8080/ws/chat (or wss:// for HTTPS)
   Status should be: 101 Switching Protocols
   ```

2. **Test WebSocket manually**
   ```javascript
   // In console:
   const ws = new WebSocket('ws://localhost:8080/ws/chat');
   ws.onopen = () => console.log('Connected');
   ws.onclose = () => console.log('Closed');
   ws.onerror = (e) => console.error('Error:', e);
   ws.onmessage = (e) => console.log('Message:', e.data);
   ```

3. **Check for errors**
   - DevTools Console → Look for red errors
   - Backend logs → Look for WebSocket errors
   - Network tab → Check WS connection status

**Solutions:**

- Ensure user is logged in (JWT token valid)
- Verify other user's account exists
- Check rate limit (max 10 messages/second)
- Restart backend if connection drops
- Try refreshing page to reconnect

---

### WebSocket Connection Drops

**Symptoms:** Chat disconnects randomly, must refresh to reconnect

**Causes:**
- Network interruption
- Server restart
- JWT token expired (15 min)
- Browser closed/minimized

**Solutions:**

1. **Implement auto-reconnect**
   ```typescript
   // src/services/webSocketService.ts
   let reconnectAttempts = 0;
   const maxReconnectAttempts = 5;

   function connectWebSocket() {
     try {
       ws = new WebSocket(WS_URL);
       reconnectAttempts = 0;
     } catch (error) {
       if (reconnectAttempts < maxReconnectAttempts) {
         setTimeout(connectWebSocket, 1000 * (reconnectAttempts + 1));
         reconnectAttempts++;
       }
     }
   }
   ```

2. **Monitor connection status**
   ```typescript
   ws.onclose = () => {
     console.log('WebSocket closed, attempting reconnect...');
     connectWebSocket();
   };
   ```

3. **Re-authenticate if token expired**
   - Check if server returns 401
   - Clear stored token
   - Redirect to login page

---

## React/Component Issues

### Component Not Rendering

**Symptoms:** Component not showing on page

**Debugging Steps:**

1. **Check if component is imported**
   ```typescript
   import { MyComponent } from './components/MyComponent';
   // Verify file path is correct
   ```

2. **Verify component is used**
   ```typescript
   function App() {
     return <MyComponent /> // Make sure it's in JSX
   }
   ```

3. **Check conditional rendering**
   ```typescript
   // ✅ Correct
   {shouldRender && <MyComponent />}

   // ❌ Wrong (always renders)
   {shouldRender ? <MyComponent /> : null}
   // ^ This is fine too
   ```

4. **Check component props**
   ```javascript
   // In React DevTools:
   // Find component → Check props
   // Verify all required props are passed
   ```

**Solutions:**

- Fix import path (check file actually exists)
- Add console.log to verify component runs
- Use React DevTools to inspect component tree
- Check if component is conditionally hidden (display: none)

---

### State Not Updating

**Symptoms:** Change state but UI doesn't update

**Causes:**
- Mutating state directly instead of creating new object
- Not using state setter from useState
- Setting state in wrong scope
- Component not re-rendering

**Solutions:**

```typescript
// ❌ Wrong: directly mutate array
const [items, setItems] = useState([]);
items.push(newItem);  // Won't trigger re-render

// ✅ Correct: create new array
const [items, setItems] = useState([]);
setItems([...items, newItem]);  // Triggers re-render

// ❌ Wrong: mutate object
const [user, setUser] = useState({});
user.name = 'John';  // Won't trigger re-render

// ✅ Correct: create new object
const [user, setUser] = useState({});
setUser({ ...user, name: 'John' });  // Triggers re-render
```

---

### Infinite Loops/Re-renders

**Symptoms:** Console shows errors repeated many times, app freezes

**Causes:**
- State update in render
- Invalid dependency array in useEffect
- Context causing re-renders
- Recursive component calls

**Solutions:**

```typescript
// ❌ Wrong: fetch on every render
function UserList() {
  const [users, setUsers] = useState([]);
  
  // This runs EVERY render, causing infinite loop
  fetch('/api/users')
    .then(r => r.json())
    .then(setUsers);
  
  return <div>{users.length}</div>;
}

// ✅ Correct: fetch only once
function UserList() {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);  // Empty dependency array = run once
  
  return <div>{users.length}</div>;
}

// ❌ Wrong: object in dependency array
function MyComponent() {
  const config = { key: 'value' };  // New object each render
  useEffect(() => {
    console.log(config);
  }, [config]);  // Causes infinite loop
}

// ✅ Correct: use useMemo for objects
function MyComponent() {
  const config = useMemo(() => ({ key: 'value' }), []);
  useEffect(() => {
    console.log(config);
  }, [config]);  // Doesn't cause infinite loop
}
```

---

## Build & Deployment

### Vercel Build Fails

**Error:** `Build failed`, `npm ERR!`, `Error: unknown`

**Solutions:**

1. **Check npm install succeeds locally**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check build command**
   - Vercel → Settings → Build & Development Settings
   - Build Command should be: `npm run build`
   - Output Directory should be: `dist`

3. **Check Node version**
   - Vercel → Settings → Node.js Version
   - Set to 18 or 20 (modern versions)
   - Restart build

4. **Check environment variables**
   - Vercel → Settings → Environment Variables
   - Must include: `VITE_API_BASE_URL`
   - Rebuild after adding/changing

5. **View logs**
   - Vercel → Deployments → Click deployment
   - Logs tab → See full error message

---

### App Deployed But Shows Blank Page

**Symptoms:** vercel.app domain shows loading forever or blank white page

**Debugging Steps:**

1. **Check browser console**
   - F12 → Console tab
   - Look for red JavaScript errors

2. **Check network tab**
   - F12 → Network tab
   - index.html returning 200?
   - Are scripts loaded?
   - Any 404 on assets?

3. **Check React DevTools**
   - React DevTools extension
   - Does app appear in component tree?
   - Are any errors shown?

4. **Test production build locally**
   ```bash
   npm run build
   npm run preview
   # Open http://localhost:5173
   # Should work same as deployed
   ```

**Solutions:**

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check VITE_API_BASE_URL is set correctly
- Check for console errors (usually points to issue)
- Redeploy from Vercel dashboard

---

### API Calls Fail After Deployment

**Symptoms:** Works locally, fails on vercel.app

**Debugging Steps:**

```javascript
// Check env var in console:
console.log(import.meta.env.VITE_API_BASE_URL)
// Should show your backend URL, not undefined
```

**Solutions:**

1. **Check env var is set**
   - Vercel → Settings → Environment Variables
   - Must include: `VITE_API_BASE_URL=https://...`
   - No value should be empty

2. **Check URL format**
   - Must start with `https://` (for HTTPS)
   - No trailing slash
   - Valid domain name

3. **Redeploy after changes**
   - Changes to env vars require rebuild
   - Vercel → Deployments → "Redeploy"

4. **Check backend is running**
   - Visit backend /health endpoint directly
   - Should return: `{"status":"ok"}`

---

## Performance Issues

### App Loads Slowly

**Solutions:**

1. **Check bundle size**
   ```bash
   npm run build
   # See dist/ folder size
   ```

2. **Reduce bundle**
   - Remove unused dependencies
   - Lazy load routes
   - Use code splitting

3. **Check network tab**
   - F12 → Network tab
   - Which files are slow to download?
   - Compress large files

4. **Check Dev Tools Performance**
   - F12 → Performance tab
   - Record page load
   - See what takes time

---

### Page Freezes When Loading Data

**Solutions:**

1. **Implement loading state**
   ```typescript
   const [loading, setLoading] = useState(false);
   const [data, setData] = useState(null);

   useEffect(() => {
     setLoading(true);
     fetch('/api/data')
       .then(r => r.json())
       .then(d => { setData(d); setLoading(false); });
   }, []);

   if (loading) return <LoadingSpinner />;
   return <DataView data={data} />;
   ```

2. **Use pagination**
   - Don't load all data at once
   - Load 20 items, then more on scroll

3. **Virtualize long lists**
   ```bash
   npm install react-window
   ```

---

## Getting Help

### Collect Debugging Info

When reporting issues, include:

1. **Console errors** (F12 → Console)
2. **Network errors** (F12 → Network)
3. **Steps to reproduce** (exact clicks to trigger issue)
4. **Device/browser** (Chrome 120, Firefox 121, etc)
5. **Environment** (local dev, staging, production)
6. **Screenshots** of error

### Useful Debug Commands

```javascript
// In console:
console.log('Current URL:', window.location.href);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Cookies:', document.cookie);
console.log('LocalStorage:', localStorage);
```

---

Last Updated: March 28, 2026
