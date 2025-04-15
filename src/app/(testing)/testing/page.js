'use client';

import AvailabilityCalendar from "../components/AvailabilityCalendar"
import ImageUploading from "../components/ImageUploading"

export default function Testing() {
  return (
    <main className="flex flex-1 flex-col justify-center bg-[#F5F5F5] h-dvh">
      <AvailabilityCalendar />
      {/* <ImageUploading /> */}
    </main>
  )
}