import Image from 'next/image'

export default function Loading() {
  return (
    <main className='h-dvh w-full flex items-center justify-center bg-white'>
      <div className='text-center bg-white'>
        <Image src='/svg/red-logo.svg' alt='logo' width={40} height={40} className='animate-spin mx-auto mb-4' />
        <p className='text-xl font-bold text-red-500'>
          Please Stand By
        </p>
      </div>
    </main>
  )
}