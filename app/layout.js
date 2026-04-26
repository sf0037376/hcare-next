import './globals.css'
import ClientShell from '@/components/ClientShell'

export const metadata = {
  title: 'RCHI | Modern Patient Monitoring',
  description: 'High-precision clinical monitoring for Neonatal and Pediatric care.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="https://ui-avatars.com/api/?name=HCare&background=0ea5e9&color=fff&size=192" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  )
}
