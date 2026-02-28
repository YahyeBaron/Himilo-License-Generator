import { Pool } from 'pg'
import { NextResponse } from 'next/server'

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

// PATCH /api/licenses/[id] — update status or expiry
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { status, expiresAt, maxDevices, clientName, companyId } = body

        const updates: string[] = []
        const values: any[] = []
        let idx = 1

        if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status) }
        if (expiresAt !== undefined) { updates.push(`expires_at = $${idx++}`); values.push(expiresAt || null) }
        if (maxDevices !== undefined) { updates.push(`max_devices = $${idx++}`); values.push(maxDevices) }
        if (clientName !== undefined) { updates.push(`client_name = $${idx++}`); values.push(clientName) }
        if (companyId !== undefined) { updates.push(`company_id = $${idx++}`); values.push(companyId) }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
        }

        values.push(params.id)
        const result = await pool.query(
            `UPDATE licenses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        )

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'License not found' }, { status: 404 })
        }

        return NextResponse.json(result.rows[0])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE /api/licenses/[id] — permanently remove (use status=suspended instead)
export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await pool.query('DELETE FROM licenses WHERE id = $1', [params.id])
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
