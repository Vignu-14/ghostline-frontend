# 🌐 Ghostline Frontend

A modern, real-time anonymous messaging application built with React, TypeScript, Vite, and Tailwind CSS.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-blue?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

**Live Demo:** https://ghostline-frontend-five.vercel.app

---

## ✨ Features

- 🔐 **Anonymous Messaging** - Send and receive anonymous messages
- 💬 **Real-time Chat** - WebSocket-powered instant messaging
- 👥 **User Management** - Create profiles and manage accounts
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS
- ✅ **Type Safe** - Full TypeScript support
- ⚡ **Fast** - Optimized with Vite and React

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Real-time:** WebSocket

### Backend Integration
- **API:** REST (HTTP)
- **Real-time:** WebSocket
- **Authentication:** JWT tokens (httpOnly cookies)
- **Storage:** Supabase (file uploads)

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+ or yarn

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Vignu-14/ghostline-frontend.git
cd ghostline-frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
# Edit .env:
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000

# 5. Start development server
npm run dev
```

Server runs at `http://localhost:5173`

---

## 🚀 Quick Links

📚 **Documentation:**
- [Development Guide](./docs/DEVELOPMENT.md) - Set up and develop locally
- [Architecture Guide](./docs/ARCHITECTURE.md) - Technical architecture and design patterns
- [Debugging Guide](./docs/DEBUGGING.md) - Troubleshooting common issues
- [Backend API Docs](../ghostline-backend-repo/docs/API_DOCUMENTATION.md) - Complete API reference

🔧 **Deployment:**
- [Deployment Guide](../ghostline-backend-repo/docs/DEPLOYMENT.md) - Deploy to production

---

## 📋 Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Page components (HomePage, ChatPage, etc.)
├── context/            # React Context providers (Auth, Chat)
├── services/           # API and external services
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
├── utils/              # Utility functions
├── styles/             # Global CSS styles
└── assets/             # Images, fonts, etc.

docs/
├── DEVELOPMENT.md      # Frontend development guide
├── ARCHITECTURE.md     # Frontend architecture
└── DEBUGGING.md        # Troubleshooting guide
```

---

## 🚀 Available Scripts

### Development
```bash
# Start dev server with hot reload
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Production
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Environment Variables

Create `.env` file with:

```env
# Development
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000

# Production (example)
VITE_API_BASE_URL=https://ghostline-backend-production-xxxx.up.railway.app
VITE_WS_BASE_URL=wss://ghostline-backend-production-xxxx.up.railway.app
```

---

## 📱 Pages

### Public Pages
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - Create new account

### Authenticated Pages
- **Home** (`/`) - Feed with posts from users
- **Chat** (`/chat`) - Real-time messaging
- **Profile** (`/profile/:userId`) - User profile and posts
- **Admin** (`/admin`) - Admin dashboard (admin users only)

---

## 🔌 API Integration

Frontend communicates with backend via:

### REST API
```typescript
// GET request
const users = await apiClient.get('/api/users');

// POST request
const post = await apiClient.post('/api/posts', {
  caption: 'My post',
  image_url: 'path/to/image'
});

// All requests include JWT token from httpOnly cookie automatically
```

### WebSocket
```typescript
// Connect
socketService.connect();

// Send message
socketService.sendMessage(receiverId, content);

// Receive message (auto-updates UI)
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

---

## 🐛 Troubleshooting

**API Connection Error?**
- Check `VITE_API_BASE_URL` in `.env` is correct
- Verify backend is running
- Hard refresh browser (`Ctrl+Shift+R`)

**WebSocket not connecting?**
- Ensure JWT token is valid (login first)
- Check backend WebSocket endpoint is accessible
- Verify `VITE_WS_BASE_URL` in `.env`

**Build fails?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install`
- Check for TypeScript errors: `npm run type-check`

For detailed troubleshooting, see [Debugging Guide](./docs/DEBUGGING.md)

---

## 📈 Performance Optimizations

- ✅ Code splitting with lazy loading
- ✅ Component memoization to prevent unnecessary re-renders
- ✅ Infinite scroll for efficient data loading
- ✅ WebSocket for real-time updates (no polling)
- ✅ Optimized bundle with Vite

---

## 🔐 Security

- ✅ JWT authentication with httpOnly cookies
- ✅ CORS validation on backend
- ✅ XSS protection (React JSX escaping)
- ✅ CSRF protection (SameSite=Strict cookies)
- ✅ No sensitive data in localStorage

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Set environment variables:
     - `VITE_API_BASE_URL` → Backend URL
     - `VITE_WS_BASE_URL` → Backend WebSocket URL
   - Click Deploy

3. **Monitor deployment:**
   - Check Vercel Dashboard for logs
   - Visit your frontend URL

For detailed deployment instructions, see [Backend Deployment Guide](../ghostline-backend-repo/docs/DEPLOYMENT.md)

---

## 📚 Documentation

- [Ghostline Backend](https://github.com/Vignu-14/ghostline-backend) - REST API & WebSocket server
- [API Documentation](../ghostline-backend-repo/docs/API_DOCUMENTATION.md) - Complete endpoint reference
- [System Architecture](../ghostline-backend-repo/docs/ARCHITECTURE.md) - Full system design

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) file for details.

---

## 👨‍💻 Author

Vignu Pandey - [@Vignu-14](https://github.com/Vignu-14)

---

## 🙏 Acknowledgments

- React and Vite communities for amazing tools
- Tailwind CSS for beautiful defaults
- Supabase for backend services

---

## 📞 Support

Need help? Check:
- [Development Guide](./docs/DEVELOPMENT.md) - Local setup
- [Debugging Guide](./docs/DEBUGGING.md) - Common issues
- [Architecture Guide](./docs/ARCHITECTURE.md) - Component structure
- Backend [Troubleshooting Guide](../ghostline-backend-repo/docs/TROUBLESHOOTING.md)

---

**Happy coding! 🚀**
