import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'azpin_user',
    password: process.env.DB_PASSWORD || 'azpin_pass',
    database: process.env.DB_NAME || 'azpin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

export async function initDB() {
    console.log('Starting database initialization check...');
    try {
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        console.log(`Looking for schema at: ${schemaPath}`);
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            // Execute schema. multipleStatements: true is important here.
            await pool.query(schema);
            console.log('✅ Database schema applied successfully');
        } else {
            console.error('❌ CRITICAL: schema.sql NOT FOUND at', schemaPath);
            console.warn('Database tables might be missing!');
        }
    } catch (err) {
        console.error('❌ Database initialization FAILED:', err.message);
        throw err; // Propagate error to crash server on failed init
    }
}

export default pool;
