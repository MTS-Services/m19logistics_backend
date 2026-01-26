# M19 Logistics - Courier Management System

A comprehensive courier management system built with Express.js, Prisma, and PostgreSQL.

## 🚀 Features

- **Role-Based Access Control**: Admin, Driver, Customer, and Manager roles
- **JWT Authentication**: Secure authentication with 30-day token expiry
- **Delivery Management**: Complete delivery tracking from request to completion
- **Invoice Generation**: Automated weekly invoice generation
- **Pricing Tiers**: Flexible pricing based on weight and distance
- **Driver Management**: Assign deliveries and track driver performance
- **Proof of Delivery**: Signature and photo capture
- **Analytics Dashboard**: Comprehensive reporting and analytics

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
m19logistics/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding
├── src/
│   ├── config/
│   │   ├── index.js           # Configuration settings
│   │   └── database.js        # Prisma client setup
│   ├── controllers/
│   │   └── authController.js  # Authentication controller
│   ├── middleware/
│   │   ├── authenticate.js    # JWT authentication
│   │   ├── authorize.js       # Role-based authorization
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # Request validation
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   └── authRoutes.js      # Auth routes
│   ├── services/
│   │   ├── authService.js     # Authentication service
│   │   └── userService.js     # User service
│   ├── utils/                 # Utility functions
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── public/
│   └── uploads/               # File uploads
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🔑 User Roles

- **ADMIN**: Full system access
- **DRIVER**: View assigned deliveries, upload proof of delivery
- **CUSTOMER**: Request deliveries, view history and invoices
- **MANAGER**: Analytics and reporting access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password

### Health Check
- `GET /api/health` - API health status

## 🗄️ Database Schema

The system uses the following main models:
- **User**: User accounts with role-based access
- **Delivery**: Delivery requests and tracking
- **Invoice**: Weekly invoices per customer
- **PricingTier**: Pricing configuration
- **AccessToken**: JWT token management
- **AuditLog**: Change tracking
- **DriverFeedback**: Driver notes per delivery

## 🔒 Security

- JWT-based authentication with 30-day expiry
- Bcrypt password hashing
- Role-based access control
- Token revocation support
- Helmet.js security headers
- Request validation

## 📧 Email Configuration

Configure SMTP settings in `.env` for:
- Delivery notifications
- Invoice emails
- Weekly reports

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

This is a private project for M19 Logistics Limited.

## 📄 License

ISC

## 📞 Support

For support, email admin@m19logistics.com or call 07971415430.
