'use client'
import PropertyDetail from "@/app/components/site/PropertyDetail"

export default function PropertyPage({ params }) {

  return (
    <main>
      <PropertyDetail params={params} />
    </main>
  )
}
