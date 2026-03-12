import { Pool } from 'pg'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

// Ensure licenses table exists
async function ensureTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      client_name TEXT NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TIMESTAMP,
      max_devices INTEGER DEFAULT 1,
      machine_id TEXT,
      last_seen_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}

// GET /api/licenses — list all
export async function GET() {
    try {
        await ensureTable()
        const result = await pool.query(
            'SELECT * FROM licenses ORDER BY created_at DESC'
        )
        return NextResponse.json(result.rows)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST /api/licenses — generate a new license
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { clientName, companyId, expiresAt, maxDevices, status } = body
        
        console.log('[License Portal] Generating license for:', { clientName, status });

        if (!clientName) {
            return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
        }

        await ensureTable()

        const id = uuidv4()
        const licenseKey = uuidv4().replace(/-/g, '').toUpperCase()
            .match(/.{1,6}/g)!.join('-')  // Format: XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX

        // Enforce a valid status, default to 'active'
        const finalStatus = (status === 'active' || status === 'grace' || status === 'suspended') 
            ? status 
            : 'active';

        await pool.query(
            `INSERT INTO licenses (id, company_id, client_name, license_key, status, expires_at, max_devices)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, companyId || null, clientName, licenseKey, finalStatus, expiresAt || null, maxDevices || 1]
        )

        const result = await pool.query('SELECT * FROM licenses WHERE id = $1', [id])
        console.log('[License Portal] License generated successfully:', result.rows[0].id);
        return NextResponse.json(result.rows[0], { status: 201 })
    } catch (err: any) {
        console.error('[License Portal] Generation error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
