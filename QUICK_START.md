# 🚀 M19 Logistics - Quick Start Guide

## ✅ Setup Complete!

Your Express.js + Prisma project structure has been created successfully.

## 📁 Project Structure Created

```
d:\m19logistics/
├── prisma/
│   ├── schema.prisma       ✅ Database schema with all models
│   └── seed.js             ✅ Initial data seeding script
├── src/
│   ├── config/
│   │   ├── index.js        ✅ Application configuration
│   │   └── database.js     ✅ Prisma client setup
│   ├── controllers/
│   │   └── authController.js ✅ Authentication logic
│   ├── middleware/
│   │   ├── authenticate.js ✅ JWT authentication
│   │   ├── authorize.js    ✅ Role-based access control
│   │   ├── errorHandler.js ✅ Error handling
│   │   └── validate.js     ✅ Request validation
│   ├── routes/
│   │   ├── index.js        ✅ Main router
│   │   └── authRoutes.js   ✅ Auth endpoints
│   ├── services/
│   │   ├── authService.js  ✅ Auth business logic
│   │   └── userService.js  ✅ User operations
│   ├── utils/              ✅ Utility functions
│   ├── app.js              ✅ Express app
│   └── server.js           ✅ Server entry point
├── public/uploads/         ✅ File upload directories
├── .env                    ✅ Environment variables
├── .gitignore              ✅ Git ignore rules
├── package.json            ✅ Dependencies installed
└── README.md               ✅ Documentation
```

## 🎯 Next Steps

### 1. Run Database Migration

```bash
npx prisma migrate dev --name init
```

This will create all database tables based on your schema.

### 2. Seed the Database

```bash
npm run prisma:seed
```

This will create:
- ✅ 2 Pricing Tiers (Tier A & Tier B)
- ✅ 6 Customer accounts (Topps stores)
- ✅ 1 Admin account
- ✅ 1 Driver (BK)
- ✅ 1 Area Manager (Rob Myers)

### 3. Start the Development Server

```bash
npm run dev
```

Server will run on: `http://localhost:5000`

### 4. Test the API

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Login as Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

## 🔑 Default Login Credentials

### Admin
- **Email:** admin@m19logistics.com
- **Password:** Admin123!

### Driver (BK)
- **Username:** BK01
- **Password:** M1901 *(requires password reset)*

### Area Manager (Rob Myers)
- **Username:** Rob01
- **Password:** Topps01 *(requires password reset)*

### Customers (Topps Stores)
- **T022** - topps022@toppstiles.co.uk - Password: Password022
- **T226** - topps226@toppstiles.co.uk - Password: Password226
- **T167** - topps167@toppstiles.co.uk - Password: Password167
- **T143** - topps143@toppstiles.co.uk - Password: Password143
- **T211** - topps211@toppstiles.co.uk - Password: Password211
- **T217** - topps217@toppstiles.co.uk - Password: Password217

All customer passwords follow the pattern: `Password[LoginID]`

## 🗄️ Database Schema

### Main Models:
- ✅ **User** - All users (Admin, Driver, Customer, Manager)
- ✅ **AccessToken** - JWT token management (30-day expiry)
- ✅ **PricingTier** - Tier A (£50) & Tier B (£45) per 800kg
- ✅ **Delivery** - Delivery requests and tracking
- ✅ **Invoice** - Weekly invoices
- ✅ **InvoiceItem** - Invoice line items
- ✅ **ExtraCharge** - Tolls, extra runs, etc.
- ✅ **DriverFeedback** - Driver notes per delivery
- ✅ **AuditLog** - Change tracking
- ✅ **SlotAvailability** - AM/PM slot management
- ✅ **SystemSetting** - System configuration

### User Roles:
- **ADMIN** - Full access to everything
- **DRIVER** - Assigned deliveries + proof upload
- **CUSTOMER** - Request deliveries, view history
- **MANAGER** - Analytics and reporting (read-only)

## 🔒 Authentication

- JWT tokens with 30-day expiry
- Tokens stored in database for revocation
- Role-based access control
- Password reset required on first login

## 📡 Available API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Health
- `GET /api/health` - API status

## 🛠️ Useful Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 📊 Prisma Studio

To view and edit your database visually:

```bash
npm run prisma:studio
```

Opens at: `http://localhost:5555`

## 🔧 Configuration

All configuration is in `.env` file:

```env
DATABASE_URL=postgres://postgres:...@147.93.107.217:5426/postgres
PORT=5000
JWT_SECRET=m19logistics-super-secret-jwt-key-2026
JWT_EXPIRES_IN=30d
```

## 📝 What's Next?

You can now start building:

1. **Delivery Management** - Controllers, routes, services
2. **Invoice Generation** - PDF creation with PDFKit
3. **Driver Portal** - Proof of delivery upload
4. **Customer Portal** - Delivery requests
5. **Admin Dashboard** - User & delivery management
6. **Analytics** - Reports and statistics
7. **Email Notifications** - Nodemailer integration
8. **Distance Calculation** - Google Maps API

## 🎨 Frontend Development

The backend is ready. You can now:
- Build a React/Vue/Angular frontend
- Create mobile apps that consume this API
- Use the API with any frontend framework

## ⚠️ Important Notes

1. Change `JWT_SECRET` in `.env` for production
2. Set up proper email credentials (SMTP)
3. Add your Google Maps API key
4. All customers require password reset on first login
5. Invoice numbering starts at T0326

## 🐛 Troubleshooting

**Database Connection Issues:**
```bash
# Test connection
npx prisma db push
```

**Reset Database:**
```bash
npx prisma migrate reset
```

**View Logs:**
- Check terminal output for detailed error messages
- Prisma logs are enabled in development mode

## 📞 Support

For issues or questions about M19 Logistics system:
- Email: admin@m19logistics.com
- Phone: 07971415430

---

**✨ Your M19 Logistics backend is ready to go!**
