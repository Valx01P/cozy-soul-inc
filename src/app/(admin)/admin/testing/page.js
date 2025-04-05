'use client'
import useAuthStore from "../../../../stores/authStore"
import { LocationForm } from "@/app/components/admin/forms/archive/LocationForm"
import { DetailsForm } from "@/app/components/admin/forms/archive/DetailsForm"
import { BasicInfoForm } from "@/app/components/admin/forms/archive/BasicInfoForm"
import { PropertyForm } from "@/app/components/admin/forms/PropertyForm"

export default function TestingPage() {
  const { user, token, isAuthenticated } = useAuthStore((state) => state)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* <LocationForm />
      <DetailsForm />
      <BasicInfoForm /> */}
      <PropertyForm />
      
      {/* <code>
        {JSON.stringify({ user, token, isAuthenticated }, null, 2)}
      </code> */}


    </div>
  )
}