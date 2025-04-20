// src/app/components/site/LoadingSpinner.jsx
import Image from 'next/image'

export default function LoadingSpinner({ size = 40 }) {
  return (
    <div className='text-center'>
      <Image 
        src='/svg/red-logo.svg' 
        alt='Loading' 
        width={size} 
        height={size} 
        className='animate-spin mx-auto' 
      />
    </div>
  )
}