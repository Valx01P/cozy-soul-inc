'use client'
import { use } from "react"
import PropertyDetail from "@/app/components/minimal/site/PropertyDetail"

export default function PropertyPage({ params }) {
  // React.use() should be used to unwrap the params promise
  // This will fix the warning: "A param property was accessed directly with params.id"
  
  return (
    <main>
      <PropertyDetail params={params} />
    </main>
  )
}

// 'use client'
// import { use } from "react"
// import PropertyDetail from "@/app/components/site/PropertyDetail"

// export default function PropertyPage({ params }) {
//   // React.use() should be used to unwrap the params promise
//   // This will fix the warning: "A param property was accessed directly with params.id"
  
//   return (
//     <main>
//       <PropertyDetail params={params} />
//     </main>
//   )
// }