require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`ðŸš€ Neosoft OTP Auth Backend Server running on port ${PORT}`);
      console.log(`ðŸŒ Base URL: http://localhost:${PORT}/api/auth`);
      console.log(`ðŸ¥ Health Check: http://localhost:${PORT}/api/health`);
      console.log(`âš™ï¸  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('====================================================');
    });

    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        console.log('[Server] Database disconnected. Process exiting.');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('[Server] Forceful shutdown initiated after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
