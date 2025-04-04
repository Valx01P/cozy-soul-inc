import Image from 'next/image'
import Link from 'next/link'
import { Search, XIcon, HamburgerMenu } from '../svg/Icons'
import react from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = react.useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className='h-[5rem] bg-[#F5F5F5] flex flex-row justify-between items-center px-14 max-cxs:px-8'>

      <div className='flex flex-row items-center justify-between w-full'>
        {/* logo */}
        <div className='flex flex-1'>
        {/* w-350 h-60 */}
          <Link href="/" className='flex items-center transition-transform duration-300 hover:scale-110'>
            <Image src="/svg/red-logo-full.svg" alt="Logo" width={185} height={37} className='max-cmd2:hidden' />
            <Image src="/svg/red-logo-full.svg" alt="Logo" width={200} height={40} className='cmd2:hidden max-c2xs:hidden' />
            <Image src='/svg/red-logo.svg' alt='logo' width={30} height={30} className='c2xs:hidden' />
          </Link>
        </div>

        {/* search bar */}
        <div className='flex flex-1 flex-row relative max-cmd2:hidden'>
          <input
            type='text'
            id='search'
            // border-1 border-gray-500
            className='bg-white flex flex-1 h-[50px] dark-shadow pl-14 py-4 rounded-4xl text-lg'
            placeholder='Search...'
          />
          <button className='absolute left-4.5 top-2.75 hover:cursor-pointer transition-transform duration-300 hover:scale-110'>
            <Search size={30} strokeWidth={2.5} color='var(--primary-red)' />
            {/* <XIcon size={30} strokeWidth={2.5} color='#FB5904' />
            <HamburgerMenu size={30} strokeWidth={2.5} color='#FB5904' /> */}
          </button>
        </div>

        {/* responsive navigation */}
        <div className='flex flex-1 flex-row max-cmd2:flex-0'>

          {/* desktop navlinks */}
          <div className='flex flex-1 flex-row gap-12 items-center justify-end max-clg:gap-8 max-clg:flex-0 max-clg:pl-[4rem] max-cmd:pl-[2rem] max-cmd2:hidden'>
            <div className='flex flex-center'>
              <Link href="/about" className='text-lg font-medium text-[var(--primary-red)] transition-transform duration-300 hover:scale-110'>About</Link>
            </div>

            <div className='flex bg-[var(--primary-red)] rounded-full p-3 w-[7rem] flex-center color-transition duration-500 hover:bg-[var(--primary-red-hover)]'>
              <Link href="/contact" className='text-lg font-medium text-white'>Contact</Link>
            </div>
          </div>


          {/* mobile navigation - hamburger menu */}
          <div className='cmd2:hidden flex justify-end items-center'>
            {!isMenuOpen ? (
              <button onClick={() => toggleMenu()} className='hover:cursor-pointer'>
                <HamburgerMenu size={42} strokeWidth={3.5} color='var(--primary-red)'/>
              </button>
            ) : (
              <button onClick={() => toggleMenu()} className='hover:cursor-pointer'>
                <XIcon size={42} strokeWidth={3.5} color='var(--primary-red)'/>
              </button>
            )}
          </div>

            {/* Overlay that blurs everything */}
            {isMenuOpen && <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300' onClick={() => toggleMenu()}/>}
            
            {/* Sidebar menu */}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-end mb-6">
                  <button onClick={toggleMenu} className="hover:cursor-pointer">
                    <XIcon size={32} strokeWidth={3} color='var(--primary-red)'/>
                  </button>
                </div>
                
                <div className="flex flex-col gap-6">
                  <Link href="/about" className='text-xl font-medium hover:text-[var(--primary-red)] transition-colors duration-300' onClick={toggleMenu}>
                    About
                  </Link>
                  <Link href="/contact" className='text-xl font-medium hover:text-[var(--primary-red)] transition-colors duration-300' onClick={toggleMenu}>
                    Contact
                  </Link>
                  
                </div>
              </div>
            </div>
        </div>
      </div>


    </nav>
  )
} 



















// import Image from 'next/image'
// import Link from 'next/link'
// import { Search, XIcon, HamburgerMenu } from '../svg/Icons'
// import react from 'react'

// export default function Navbar() {
//   const [isMenuOpen, setIsMenuOpen] = react.useState(false)

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen)
//   }

//   return (
//     <nav className='h-[5rem] bg-[#F5F5F5] flex flex-row justify-between items-center px-14 max-cxs:px-8'>

//       {/* logo */}
//       <div className='flex'>
//       {/* w-350 h-60 */}
//         <Link href="/" className='flex items-center'>
//           <Image src="/svg/red-logo-full.svg" alt="Logo" width={267} height={45} className='max-csm:hidden' />
//           <Image src="/svg/red-logo-full.svg" alt="Logo" width={232} height={40} className='csm:hidden max-c2xs:hidden' />
//           <Image src='/svg/red-logo.svg' alt='logo' width={35} height={35} className='c2xs:hidden' />
//           {/* <Image src="/svg/red-logo-full.svg" alt="Logo" width={180} height={35} className='max-csm:hidden' />
//           <Image src="/svg/red-logo-full.svg" alt="Logo" width={232} height={40} className='csm:hidden max-c2xs:hidden' />
//           <Image src='/svg/red-logo.svg' alt='logo' width={35} height={35} className='c2xs:hidden' /> */}
//         </Link>
//       </div>

//       {/* responsive navigation */}
//       <div className='flex flex-1 flex-row gap-24 items-center justify-end max-cxl:gap-8'>

//         {/* desktop navlinks */}
//         <div className='flex max-cxl:hidden'>
//           <Link href="/about" className='text-black text-xl hover:text-[var(--primary-red)] transition-colors duration-300'>About</Link>
//         </div>

//         <div className='flex max-cxl:hidden'>
//           <Link href="/contact" className='text-black text-xl hover:text-[var(--primary-red)] transition-colors duration-300'>Contact</Link>
//         </div>

//         {/* search bar */}
//         <div className='flex flex-row relative max-cmd:hidden'>
//           <input
//             type='text'
//             id='search'
//             // border-1 border-gray-500
//             className='bg-white flex flex-1 h-[50px] dark-shadow pl-14 py-4 rounded-4xl text-lg'
//             placeholder='Search...'
//           />
//           <button className='absolute left-4.5 top-2.75 hover:cursor-pointer'>
//             <Search size={30} strokeWidth={2.5} color='var(--primary-red)' />
//             {/* <XIcon size={30} strokeWidth={2.5} color='#FB5904' />
//             <HamburgerMenu size={30} strokeWidth={2.5} color='#FB5904' /> */}
//           </button>
//         </div>

//         {/* mobile navigation - hamburger menu */}
//         <div className='cxl:hidden flex justify-center items-center'>
//           {!isMenuOpen ? (
//             <button onClick={() => toggleMenu()} className='hover:cursor-pointer'>
//               <HamburgerMenu size={42} strokeWidth={3.5} color='var(--primary-red)'/>
//             </button>
//           ) : (
//             <button onClick={() => toggleMenu()} className='hover:cursor-pointer'>
//               <XIcon size={42} strokeWidth={3.5} color='var(--primary-red)'/>
//             </button>
//           )}
//         </div>

//           {/* Overlay that blurs everything */}
//           {isMenuOpen && <div className='fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300' onClick={() => toggleMenu()}/>}
          
//           {/* Sidebar menu */}
//           <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
//             <div className="p-5 flex flex-col h-full">
//               <div className="flex justify-end mb-6">
//                 <button onClick={toggleMenu} className="hover:cursor-pointer">
//                   <XIcon size={32} strokeWidth={3} color='var(--primary-red)'/>
//                 </button>
//               </div>
              
//               <div className="flex flex-col gap-6">
//                 <Link href="/about" className='text-xl font-medium hover:text-[var(--primary-red)] transition-colors duration-300' onClick={toggleMenu}>
//                   About
//                 </Link>
//                 <Link href="/contact" className='text-xl font-medium hover:text-[var(--primary-red)] transition-colors duration-300' onClick={toggleMenu}>
//                   Contact
//                 </Link>
                
//                 {/* Mobile search - optional */}
//                 <div className='flex flex-row relative mt-4 cmd:hidden'>
//                   <input type='text' className='bg-gray-100 flex flex-1 h-[40px] pl-10 py-2 rounded-lg text-base' placeholder='Search...'/>
//                   <button className='absolute left-3 top-2 hover:cursor-pointer'>
//                     <Search size={20} strokeWidth={2.5} color='var(--primary-red)' />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//       </div>


//     </nav>
//   )
// } 