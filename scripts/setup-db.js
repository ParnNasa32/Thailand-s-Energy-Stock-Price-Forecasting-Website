const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in .env.local');
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function setup() {
    try {
        console.log('Reading setup-db.sql...');
        const sqlContent = fs.readFileSync(path.join(__dirname, '..', 'setup-db.sql'), 'utf-8');

        // The neon driver doesn't support multiple statements in one call easily 
        // for some complex scripts, but for simple ones it works.
        // If it fails, we might need to split by semicolon.

        console.log('Executing SQL commands...');
        // We split by ';' and filter out empty strings to execute separately 
        // because some drivers have issues with multiple statements.
        const commands = sqlContent.split(';').filter(cmd => cmd.trim());

        for (const cmd of commands) {
            if (cmd.trim()) {
                await sql(cmd);
            }
        }

        console.log('✅ Database setup completed successfully!');
        console.log('You can now login with:');
        console.log('Username: admin');
        console.log('Password: password123');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
