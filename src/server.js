const app = require('./app');
const config = require('./config');
const cronService = require('./services/cronService');

const PORT = config.port;

const server = app.listen(PORT, () => {
  
  console.log('🚚 M19 Logistics API Server');
 
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  
  // Initialize cron jobs
  cronService.initializeJobs();
  console.log('⏰ Cron jobs initialized');
 
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
