import { Geist, Geist_Mono, Montserrat } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/app/providers/AuthProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "CozySoul Inc | Miami Properties",
  description: "South Miami Properties for rent at affordable prices",
  icons: {
    icon: "/svg/red-logo.svg",
    shortcut: "/svg/red-logo.svg",
    apple: "/svg/red-logo.svg",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased h-full w-full bg-[#F5F5F5]`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}