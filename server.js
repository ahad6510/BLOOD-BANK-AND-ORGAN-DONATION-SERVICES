const fs = require('fs');
require('dotenv').config();

// --- Imports ---
const express = require('express');
const mysql = require('mysql2'); // Changed from sqlite3 to mysql2
const cors = require('cors');

// --- Initialization ---
const app = express();
const PORT = 3000;

// --- IMPORTANT: MySQL Database Connection ---
// You MUST update these details with your own MySQL server configuration.
const db = mysql.createPool({
     host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync("ca.pem")
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Using promises for async/await

// --- Test Connection and Create Table ---
async function initializeDatabase() {
    try {
        const connection = await db.getConnection();
        console.log("Successfully connected to the MySQL database.");

        // SQL command for MySQL to create the 'donors' table.
        // Note the syntax differences: AUTO_INCREMENT, TINYINT(1) for boolean.
        await connection.query(`
            CREATE TABLE IF NOT EXISTS donors (
                id INT PRIMARY KEY AUTO_INCREMENT,
                fullName VARCHAR(255) NOT NULL,
                age INT NOT NULL,
                gender VARCHAR(50) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                isBloodDonor TINYINT(1),
                bloodType VARCHAR(10),
                isOrganDonor TINYINT(1),
                organs TEXT,
                registeredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Donors table is ready.");
        connection.release();
    } catch (err) {
        console.error("Error initializing database:", err.message);
        // Exit the process if the database connection fails
        process.exit(1); 
    }
}

initializeDatabase();


// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---

// GET Endpoint: Fetch all donors using async/await
app.get('/api/donors', async (req, res) => {
    try {
        const sql = "SELECT * FROM donors ORDER BY registeredAt DESC";
        const [rows] = await db.query(sql);
        res.json({
            message: "success",
            data: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Endpoint: Add a new donor using async/await
app.post('/api/donors', async (req, res) => {
    try {
        const {
            fullName, age, gender, phone, city, state,
            isBloodDonor, bloodType, isOrganDonor, organs
        } = req.body;

        const sql = `
            INSERT INTO donors (fullName, age, gender, phone, city, state, isBloodDonor, bloodType, isOrganDonor, organs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            fullName, age, gender, phone, city, state,
            isBloodDonor, bloodType, isOrganDonor, JSON.stringify(organs)
        ];

        const [result] = await db.query(sql, params);

        res.status(201).json({
            message: "Donor registered successfully!",
            donorId: result.insertId
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

