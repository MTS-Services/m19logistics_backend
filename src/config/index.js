require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  backendUrl: process.env.BACKEND_URL || "http://localhost:3000",

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM,
    enquiries: process.env.EMAIL_ENQUIRIES,
    admin: process.env.EMAIL_ADMIN,
    deliveries: process.env.EMAIL_DELIVERIES,
    invoices: process.env.EMAIL_INVOICES,
    ben: process.env.EMAIL_BEN,
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  company: {
    name: process.env.COMPANY_NAME,
    address: process.env.COMPANY_ADDRESS,
    phone: process.env.COMPANY_PHONE,
    email: process.env.COMPANY_EMAIL,
    vat: process.env.COMPANY_VAT,
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    uploadPath: process.env.UPLOAD_PATH || "./public/uploads",
  },

  invoice: {
    prefix: process.env.INVOICE_PREFIX || "MX1X-",
    currentNumber: parseInt(process.env.CURRENT_INVOICE_NUMBER) || 0,
  },

  pricing: {
    baseDistance: 45, // miles
    weightBlock: 800, // kg
    distanceSurchargeRate: 0.5, // 50% of base price per additional 45 miles
  },
};
