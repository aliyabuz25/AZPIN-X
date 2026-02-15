import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'azpin_user',
    password: process.env.DB_PASSWORD || 'azpin_pass',
    database: process.env.DB_NAME || 'azpin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
