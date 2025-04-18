'use client';

import Navbar from '../components/minimal/site/Navbar'
import Footer from '../components/minimal/site/Footer'

export default function SiteLayout({ children }) {

  return (
    <div className="flex flex-1 flex-col justify-center bg-[#F5F5F5]">
        <Navbar/>
          {children}
        <Footer/>
    </div>
  )
}

// 'use client'

// import react from "react"
// import Loading from "../components/minimal/site/Loading"
// import Navbar from '../components/minimal/site/Navbar'
// import Footer from '../components/minimal/site/Footer'

// export default function SiteLayout({ children }) {
//   const [isInitialLoading, setIsInitialLoading] = react.useState(true)

//   react.useEffect(() => {

//     // callback, once 2000 seconds have passed, do this function
//     const timer = setTimeout(() => {
//       setIsInitialLoading(false)
//     }, 200)

//     return () => clearTimeout(timer)
//   }, [])

//   if (isInitialLoading) {
//     return <Loading />
//   }

//   return (
//     <div className="flex flex-1 flex-col justify-center bg-[#F5F5F5]">
//         <Navbar/>
//           {children}
//         <Footer/>
//     </div>
//   )
// }