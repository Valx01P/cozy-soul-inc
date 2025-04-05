import Image from 'next/image'

export default function LoadingSpinner() {
  return (
    <div className='text-center bg-white'>
      <Image src='/svg/red-logo.svg' alt='logo' width={40} height={40} className='animate-spin mx-auto mb-4' />
    </div>
  )
}