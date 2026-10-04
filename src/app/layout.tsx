import type { Metadata } from 'next'
import { IBM_Plex_Sans_Thai_Looped, Mitr } from 'next/font/google'
import '@/styles/globals.css'

const body = IBM_Plex_Sans_Thai_Looped({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-looped',
})

const display = Mitr({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mitr',
})

export const metadata: Metadata = {
  title: 'กำไร',
  description: 'คำนวณต้นทุนและกำไรของสิ่งที่คุณขาย',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${body.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
