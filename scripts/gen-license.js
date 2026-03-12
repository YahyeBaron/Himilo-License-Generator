const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_42QxTGDvuHdK@ep-round-shadow-aimezni4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false },
});

async function generateLicense() {
    try {
        const clientName = 'Himilo Bakery';
        const companyId = 'himilo-bakery-prod';
        const id = uuidv4();
        const licenseKey = uuidv4().replace(/-/g, '').toUpperCase()
            .match(/.{1,6}/g).join('-').substring(0, 34); // Match the portal's format

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year validity

        console.log('Generating license for:', clientName);
        console.log('License Key:', licenseKey);

        await pool.query(
            `INSERT INTO licenses (id, company_id, client_name, license_key, status, expires_at, max_devices)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, companyId, clientName, licenseKey, 'active', expiresAt, 5]
        );

        console.log('License successfully inserted into database.');
        return licenseKey;
    } catch (err) {
        console.error('Error generating license:', err);
    } finally {
        await pool.end();
    }
}

generateLicense();
