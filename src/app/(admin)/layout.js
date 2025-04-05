'use client';

import react from "react";
import Loading from "../components/site/Loading"
import AdminNavbar from '../components/admin/AdminNav'
import Footer from '../components/site/Footer'

export default function AdminLayout({ children }) {
  const [isInitialLoading, setIsInitialLoading] = react.useState(true)

  react.useEffect(() => {

    // callback, once 2000 seconds have passed, do this function
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoading) {
    return <Loading />
  }

  return (
    <>
        <AdminNavbar/>
          {children}
        <Footer/>
    </>
  )
}