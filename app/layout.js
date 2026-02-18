'use client'
import './globals.css'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/topbar'
// import Toast from '@/components/toast'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">{children}</div>
        </div>
        
      </body>
    </html>
  )
}
