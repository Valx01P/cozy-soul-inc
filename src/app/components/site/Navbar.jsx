'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Search, XIcon, HamburgerMenu } from '../svg/Icons'
import { useState, useEffect, useRef } from 'react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [activeResultIndex, setActiveResultIndex] = useState(0)
  const searchInputRef = useRef(null)
  
  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Clear all search highlights
  const clearSearchHighlights = () => {
    document.querySelectorAll('.search-highlight, .search-highlight-active').forEach((el) => {
      el.classList.remove('search-highlight', 'search-highlight-active')
    })
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    
    // If the search field is cleared, remove all highlights
    if (newValue === '') {
      clearSearchHighlights()
      setSearchResults([])
    }
  }

  // Handle clearing the search
  const handleClearSearch = () => {
    setSearchValue('')
    clearSearchHighlights()
    setSearchResults([])
    
    // Focus the search input after clearing
    if (searchInputRef.current) {
      const input = searchInputRef.current.querySelector('input')
      if (input) input.focus()
    }
  }

  // Handle keyboard navigation through search results
  const handleKeyDown = (e) => {
    // Handle Escape key to clear search
    if (e.key === 'Escape' && searchValue) {
      e.preventDefault()
      handleClearSearch()
      return
    }
    
    if (searchResults.length === 0) return
    
    if (e.key === 'Enter') {
      e.preventDefault()
      // Navigate to the current active result
      if (searchResults[activeResultIndex]) {
        navigateToElement(searchResults[activeResultIndex])
      }
    } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
      e.preventDefault()
      // Move to next result (similar to browser's Find Next)
      setActiveResultIndex((prevIndex) => {
        const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : 0
        navigateToElement(searchResults[newIndex])
        return newIndex
      })
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      // Move to next result
      setActiveResultIndex((prevIndex) => {
        const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : 0
        navigateToElement(searchResults[newIndex])
        return newIndex
      })
    } else if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault()
      // Move to previous result
      setActiveResultIndex((prevIndex) => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : searchResults.length - 1
        navigateToElement(searchResults[newIndex])
        return newIndex
      })
    }
  }

  // Perform search when user submits
  const performSearch = (e) => {
    e.preventDefault()
    
    if (searchValue.trim() === '') {
      clearSearchHighlights()
      setSearchResults([])
      return
    }
    
    // Find all elements with text matching the search query
    const allTextElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li')
    const matchingElements = []
    
    // Remove previous search highlights
    clearSearchHighlights()
    
    // Find and highlight all matches
    allTextElements.forEach((element) => {
      const text = element.textContent.toLowerCase()
      if (text.includes(searchValue.toLowerCase())) {
        matchingElements.push(element)
        
        // Highlight the element immediately
        element.classList.add('search-highlight')
      }
    })
    
    setSearchResults(matchingElements)
    setActiveResultIndex(0)
    
    // If results found, navigate to the first one (but all remain highlighted)
    if (matchingElements.length > 0) {
      navigateToElement(matchingElements[0])
      
      // Show a notification with result count
      const notification = document.createElement('div')
      notification.textContent = `${matchingElements.length} result${matchingElements.length !== 1 ? 's' : ''} found`
      notification.className = 'fixed top-20 right-4 bg-[var(--primary-red)] text-white py-1 px-3 rounded-lg z-50 text-sm'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    } else {
      // Show a quick notification that no results were found
      const notification = document.createElement('div')
      notification.textContent = `No results found for "${searchValue}"`
      notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-lg z-50'
      document.body.appendChild(notification)
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  }
  
  // Scroll to and highlight the element
  const navigateToElement = (element) => {
    if (!element) return
    
    // Remove active highlight class from previous elements
    document.querySelectorAll('.search-highlight-active').forEach((el) => {
      el.classList.remove('search-highlight-active')
    })
    
    // Add active highlight class to current element
    element.classList.add('search-highlight-active')
    
    // Scroll to the element with a small offset from the top
    const yOffset = -100 // Offset from the top of the viewport
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
    
    window.scrollTo({
      top: y,
      behavior: 'smooth'
    })
  }
  
  // Clean up highlights when component unmounts
  useEffect(() => {
    return () => {
      clearSearchHighlights()
    }
  }, [])
  
  // Add global stylesheet for highlight effect
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .search-highlight {
        background-color: rgba(255, 0, 82, 0.15);
        border-radius: 2px;
      }
      
      .search-highlight-active {
        background-color: rgba(255, 0, 82, 0.4);
        border-radius: 2px;
        box-shadow: 0 0 0 2px rgba(255, 0, 82, 0.4);
        position: relative;
      }
      
      /* Custom focus style for search input */
      #search:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-red), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      /* Search clear button styles */
      .search-clear-btn {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      
      .search-input-wrapper:hover .search-clear-btn,
      .search-input-wrapper:focus-within .search-clear-btn,
      .search-clear-btn:focus {
        opacity: 1;
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <nav className='h-[5rem] bg-[#F5F5F5] flex flex-row justify-between items-center px-14 max-cxs:px-8'>
      <div className='flex flex-row items-center justify-between w-full'>
        {/* logo */}
        <div className='flex flex-1'>
          <Link href="/" className='flex items-center transition-transform duration-300 hover:scale-110'>
            <Image src="/svg/red-logo-full.svg" alt="Logo" width={185} height={37} className='max-cmd2:hidden' />
            <Image src="/svg/red-logo-full.svg" alt="Logo" width={200} height={40} className='cmd2:hidden max-c2xs:hidden' />
            <Image src='/svg/red-logo.svg' alt='logo' width={30} height={30} className='c2xs:hidden' />
          </Link>
        </div>

        {/* search bar */}
        <div className='flex flex-1 flex-row relative max-cmd2:hidden' ref={searchInputRef}>
          <form onSubmit={performSearch} className="w-full">
            <div className="relative flex items-center w-full search-input-wrapper">
              <button 
                type="submit"
                className='absolute left-4.5 top-2.75 hover:cursor-pointer transition-transform duration-300 hover:scale-110'
              >
                <Search size={30} strokeWidth={2.5} color='var(--primary-red)' />
              </button>
              
              <input
                type='text'
                id='search'
                autoComplete="off"
                spellCheck="false"
                autoCapitalize="off"
                autoCorrect="off"
                className='bg-white flex flex-1 h-[50px] dark-shadow pl-14 py-4 rounded-4xl text-lg w-full'
                placeholder='Search...'
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              
              {searchValue && (
                <button 
                  type="button"
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 search-clear-btn'
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <XIcon size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </form>
          
          {/* Search result counter - appears when searching */}
          {searchResults.length > 0 && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              {activeResultIndex + 1}/{searchResults.length}
            </div>
          )}
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
                
                {/* Mobile search */}
                <div className='flex flex-col gap-2 mt-4'>
                  <label htmlFor="mobile-search" className="text-sm font-medium text-gray-700">
                    Search on page:
                  </label>
                  <form onSubmit={performSearch} className="relative">
                    <div className="relative flex items-center w-full search-input-wrapper">
                      <button type="submit" className='absolute left-3 top-2.5 hover:cursor-pointer transition-transform duration-300 hover:scale-110'>
                        <Search size={16} strokeWidth={2.5} color='var(--primary-red)' />
                      </button>
                      
                      <input
                        id="mobile-search"
                        type="text"
                        autoComplete="off"
                        spellCheck="false"
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="bg-white flex flex-1 h-10 dark-shadow pl-10 py-2 rounded-4xl text-sm w-full"
                        placeholder="Type to search..."
                        value={searchValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                      />
                      
                      {searchValue && (
                        <button 
                          type="button"
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 search-clear-btn'
                          onClick={handleClearSearch}
                          aria-label="Clear search"
                        >
                          <XIcon size={14} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </form>
                  
                  {/* Search instructions */}
                  <div className="text-xs text-gray-500 mt-1">
                    Press Enter to search, Esc to clear, Alt+↓/↑ to navigate results
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}