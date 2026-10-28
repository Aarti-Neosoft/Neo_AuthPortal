const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neosoft_auth_db';

  if (process.env.USE_MEMORY_DB === 'true') {
    return connectMemoryDB();
  }

  try {
    if (uri.includes('<db_password>')) {
      console.warn('[Database] âš ï¸ MONGODB_URI still contains the "<db_password>" placeholder in server/.env!');
      console.warn('[Database] ðŸ’¡ Please open server/.env and replace <db_password> with your actual Atlas user password.');
      console.info('[Database] Starting development MongoMemoryServer in-memory database as fallback...');
      return connectMemoryDB();
    }

    const isAtlas = uri.startsWith('mongodb+srv');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: isAtlas ? 10000 : 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB at "${uri}": ${err.message}`);
    console.info('[Database] Starting development MongoMemoryServer in-memory database as fallback...');
    return connectMemoryDB();
  }
};

const connectMemoryDB = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] MongoMemoryServer (In-Memory) connected at: ${memoryUri}`);
    return conn;
  } catch (memErr) {
    console.error('[Database] Failed to start in-memory Mongo server:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Disconnect error:', err);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
