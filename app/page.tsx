'use client'

import { useState, useEffect, useCallback } from 'react'

interface License {
    id: string
    company_id: string | null
    client_name: string
    license_key: string
    status: 'active' | 'grace' | 'suspended'
    expires_at: string | null
    max_devices: number
    machine_id: string | null
    last_seen_at: string | null
    created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'rgba(16,185,129,0.15)', text: '#10b981', dot: '#10b981' },
    grace: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', dot: '#f59e0b' },
    suspended: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', dot: '#ef4444' },
}

function StatusBadge({ status }: { status: string }) {
    const c = STATUS_COLORS[status] || STATUS_COLORS.suspended
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: c.bg, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
            {status}
        </span>
    )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24, ...style
        }}>
            {children}
        </div>
    )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
        </Card>
    )
}

export default function LicenseDashboard() {
    const [licenses, setLicenses] = useState<License[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [editLicense, setEditLicense] = useState<License | null>(null)
    const [copiedKey, setCopiedKey] = useState('')

    // Create form state
    const [form, setForm] = useState({
        clientName: '', companyId: '', expiresAt: '', maxDevices: 1, status: 'active'
    })

    const fetchLicenses = useCallback(async () => {
        try {
            const res = await fetch('/api/licenses')
            if (!res.ok) throw new Error(await res.text())
            setLicenses(await res.json())
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchLicenses() }, [fetchLicenses])

    const createLicense = async () => {
        if (!form.clientName.trim()) { alert('Client Name is required'); return }
        try {
            const res = await fetch('/api/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: form.clientName,
                    companyId: form.companyId || null,
                    expiresAt: form.expiresAt || null,
                    maxDevices: form.maxDevices,
                    status: form.status
                })
            })
            if (!res.ok) throw new Error(await res.text())
            setShowCreate(false)
            setForm({ clientName: '', companyId: '', expiresAt: '', maxDevices: 1, status: 'active' })
            await fetchLicenses()
        } catch (e: any) { alert('Error: ' + e.message) }
    }

    const updateLicense = async (id: string, updates: Partial<License>) => {
        try {
            const res = await fetch(`/api/licenses/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })
            if (!res.ok) throw new Error(await res.text())
            setEditLicense(null)
            await fetchLicenses()
        } catch (e: any) { alert('Error: ' + e.message) }
    }

    const deleteLicense = async (id: string, name: string) => {
        if (!confirm(`Permanently delete license for "${name}"? Use Suspend instead to keep records.`)) return
        await fetch(`/api/licenses/${id}`, { method: 'DELETE' })
        await fetchLicenses()
    }

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(''), 2000)
    }

    const stats = {
        total: licenses.length,
        active: licenses.filter(l => l.status === 'active').length,
        grace: licenses.filter(l => l.status === 'grace').length,
        suspended: licenses.filter(l => l.status === 'suspended').length,
    }

    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
    const fmtAgo = (d: string | null) => {
        if (!d) return 'Never'
        const diff = Date.now() - new Date(d).getTime()
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
        return `${Math.floor(diff / 86400000)}d ago`
    }

    const input: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, outline: 'none',
        boxSizing: 'border-box'
    }
    const label: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em' }
    const btn = (variant: 'primary' | 'danger' | 'ghost' | 'warning'): React.CSSProperties => ({
        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        background: variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#ef4444' : variant === 'warning' ? '#f59e0b' : 'rgba(255,255,255,0.08)',
        color: '#fff', transition: 'opacity 0.2s'
    })

    return (
        <div style={{ minHeight: '100vh', padding: '40px 32px', maxWidth: 1200, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔑</div>
                        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#e2e8f0,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            License Management
                        </h1>
                    </div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Himilo Bakery ERP — System Owner Portal</p>
                </div>
                <button style={{ ...btn('primary'), padding: '12px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => setShowCreate(true)}>
                    ＋ Generate License
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <Stat label="Total" value={stats.total} color="#e2e8f0" />
                <Stat label="Active" value={stats.active} color="#10b981" />
                <Stat label="Grace" value={stats.grace} color="#f59e0b" />
                <Stat label="Suspended" value={stats.suspended} color="#ef4444" />
            </div>

            {/* Table */}
            <Card>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading licenses...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>⚠ {error}</div>
                ) : licenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                        No licenses yet. Generate your first one ↑
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Client', 'License Key', 'Status', 'Expires', 'Devices', 'Machine ID', 'Last Seen', 'Actions'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{l.client_name}</div>
                                            {l.company_id && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{l.company_id}</div>}
                                        </td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <code style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6 }}>
                                                    {l.license_key}
                                                </code>
                                                <button onClick={() => copyKey(l.license_key)}
                                                    style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }}
                                                    title="Copy to clipboard">
                                                    {copiedKey === l.license_key ? '✓' : '📋'}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 12px' }}><StatusBadge status={l.status} /></td>
                                        <td style={{ padding: '14px 12px', fontSize: 13, color: l.expires_at && new Date(l.expires_at) < new Date() ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>{fmt(l.expires_at)}</td>
                                        <td style={{ padding: '14px 12px', fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{l.max_devices}</td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                                                {l.machine_id ? l.machine_id.slice(0, 16) + '...' : '—'}
                                            </code>
                                        </td>
                                        <td style={{ padding: '14px 12px', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{fmtAgo(l.last_seen_at)}</td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => setEditLicense(l)} style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 12 }}>Edit</button>
                                                {l.status !== 'suspended'
                                                    ? <button onClick={() => updateLicense(l.id, { status: 'suspended' } as any)} style={{ ...btn('danger'), padding: '5px 10px', fontSize: 12 }}>Suspend</button>
                                                    : <button onClick={() => updateLicense(l.id, { status: 'active' } as any)} style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 12 }}>Activate</button>
                                                }
                                                <button onClick={() => deleteLicense(l.id, l.client_name)} style={{ ...btn('danger'), padding: '5px 8px', fontSize: 14, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }} title="Delete">🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create Modal */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <Card style={{ width: 480, maxWidth: '90vw' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>Generate New License</h2>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={label}>Client Name *</label>
                                <input style={input} placeholder="e.g. Ahmed Bakery" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
                            </div>
                            <div>
                                <label style={label}>Company ID (optional)</label>
                                <input style={input} placeholder="e.g. MOG-001" value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={label}>Expiry Date</label>
                                    <input type="date" style={input} value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={label}>Max Devices</label>
                                    <input type="number" min={1} style={input} value={form.maxDevices} onChange={e => setForm(f => ({ ...f, maxDevices: parseInt(e.target.value) || 1 }))} />
                                </div>
                            </div>
                            <div>
                                <label style={label}>Initial Status</label>
                                <select style={input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="active">Active</option>
                                    <option value="grace">Grace</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                            <button style={btn('ghost')} onClick={() => setShowCreate(false)}>Cancel</button>
                            <button style={btn('primary')} onClick={createLicense}>Generate Key</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {editLicense && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <Card style={{ width: 480, maxWidth: '90vw' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>Edit License — {editLicense.client_name}</h2>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={label}>Status</label>
                                <select style={input} value={editLicense.status}
                                    onChange={e => setEditLicense(l => l ? { ...l, status: e.target.value as any } : l)}>
                                    <option value="active">Active</option>
                                    <option value="grace">Grace Period</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                            <div>
                                <label style={label}>Expiry Date</label>
                                <input type="date" style={input}
                                    value={editLicense.expires_at ? new Date(editLicense.expires_at).toISOString().split('T')[0] : ''}
                                    onChange={e => setEditLicense(l => l ? { ...l, expires_at: e.target.value } : l)} />
                            </div>
                            <div>
                                <label style={label}>Max Devices</label>
                                <input type="number" min={1} style={input} value={editLicense.max_devices}
                                    onChange={e => setEditLicense(l => l ? { ...l, max_devices: parseInt(e.target.value) || 1 } : l)} />
                            </div>
                            <div>
                                <label style={label}>Client Name</label>
                                <input style={input} value={editLicense.client_name}
                                    onChange={e => setEditLicense(l => l ? { ...l, client_name: e.target.value } : l)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                            <button style={btn('ghost')} onClick={() => setEditLicense(null)}>Cancel</button>
                            <button style={btn('primary')} onClick={() => updateLicense(editLicense.id, {
                                status: editLicense.status,
                                expires_at: editLicense.expires_at,
                                max_devices: editLicense.max_devices,
                                client_name: editLicense.client_name,
                            } as any)}>Save Changes</button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
