'use client';

import react from "react";
import Loading from "../components/site/Loading"
import Navbar from '../components/site/Navbar'
import Footer from '../components/site/Footer'

export default function SiteLayout({ children }) {
  const [isInitialLoading, setIsInitialLoading] = react.useState(true)

  react.useEffect(() => {

    // callback, once 2000 seconds have passed, do this function
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoading) {
    return <Loading />
  }

  return (
    <>
        <Navbar/>
          {children}
        <Footer/>
    </>
  )
}