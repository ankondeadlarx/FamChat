# FamChat - Encrypted Private Communication

A simple end-to-end encrypted web chat application for secure private communication.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)
```bash
git clone <repository-url>
cd FamChat
```

2. **Set up Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your configuration
npm run dev
```

3. **Set up Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
FamChat/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Custom middleware
│   │   ├── utils/       # Helper functions
│   │   └── server.js    # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API & encryption services
│   │   ├── utils/       # Helper functions
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── plan.md              # Project roadmap
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - Real-time WebSocket communication
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool & dev server
- **Socket.io-client** - WebSocket client

## 🔐 Security Features (Planned)

- End-to-end encryption using Web Crypto API
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- HTTPS/TLS in production
- Input sanitization
- CORS configuration

## 📝 Development Status

See [plan.md](plan.md) for detailed roadmap and progress tracking.

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.

## 📄 License

See LICENSE file for details.
