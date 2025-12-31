import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Database } from './types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, '../../data.json');

// In-memory database structure
let db: Database = {
  users: [],
  requests: [],
  bookings: [],
  messages: [],
  phoneVerifications: [],
  loginAttempts: [],
  oauthAccounts: [],
  emailVerifications: [],
  userProfiles: [],
  identityVerifications: [],
  uploadedFiles: [],
  auditLogs: [],
  dataExportRequests: [],
  dataDeletionRequests: [],
};

// Load database from file
function loadDB(): void {
  try {
    if (existsSync(DB_FILE)) {
      const data = readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('✅ Database loaded from file');
    } else {
      console.log('✅ New database initialized');
    }
  } catch (error) {
    console.error('Failed to load database:', error);
  }
}

// Save database to file
export function saveDB(): void {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

// Initialize on import
loadDB();

// Auto-save every 30 seconds
setInterval(saveDB, 30000);

// Save on exit
process.on('SIGINT', () => {
  saveDB();
  console.log('\n💾 Database saved');
  process.exit();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  saveDB();
  console.log('\n💾 Database saved');
  process.exit();
});

// Export database access
export default db;
