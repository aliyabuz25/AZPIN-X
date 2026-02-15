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

async function initDB() {
    try {
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('Database initialized successfully');
        } else {
            console.warn('schema.sql not found, skipping auto-init');
        }
    } catch (err) {
        console.error('Database initialization failed:', err);
    }
}

initDB();

export default pool;
