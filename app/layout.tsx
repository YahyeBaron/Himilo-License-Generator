import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Himilo License Portal',
    description: 'License Management Dashboard for Himilo Bakery ERP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body style={{ margin: 0, fontFamily: "'Inter', sans-serif", background: '#0a0a0f', color: '#e2e8f0', minHeight: '100vh' }}>
                {children}
            </body>
        </html>
    )
}
