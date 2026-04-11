import './globals.css'
import ClientShell from '@/components/ClientShell'

export const metadata = {
  title: 'RCHI | Modern Patient Monitoring',
  description: 'High-precision clinical monitoring for Neonatal and Pediatric care.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  )
}
