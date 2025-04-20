import { useState, useEffect } from 'react';

export default function Hero() {

    // Function to handle smooth scrolling
    const scrollToSection = (e) => {
      e.preventDefault();
      const targetId = e.currentTarget.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
      }
    };
    
  return (
    <section id='hero' className='relative flex flex-col items-center justify-center min-h-[90vh] w-full overflow-hidden'>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center h-full">
        
        {/* Content with clean backdrop */}
        <div className="relative z-20 flex flex-col items-center px-4 py-8 mx-auto text-center max-w-6xl">
          <h1 className="monserrat font-black text-5xl md:text-7xl text-center leading-tight">
            <span className="text-gray-900">Find the perfect place</span>
            <span className="block text-[var(--primary-red)]">for your beach getaway.</span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-700 max-w-2xl font-medium">
            Discover stunning beachfront properties with breathtaking views and unforgettable experiences.
          </p>
          
          {/* CTA Buttons - replacing search bar */}
          <div className="w-full max-w-3xl mt-10 flex flex-col md:flex-row gap-4 justify-center">
            <a 
              href="#properties" 
              onClick={scrollToSection}
              className="flex-1 px-8 py-4 bg-[var(--primary-red)] text-white font-bold rounded-full shadow-lg transition duration-300 hover:bg-[var(--primary-red-hover)] hover:shadow-xl hover:scale-105 text-lg md:text-xl text-center"
            >
              Explore Miami Homes
            </a>
            
            <a 
              href="#properties" 
              onClick={scrollToSection}
              className="flex-1 px-8 py-4 bg-white text-[var(--primary-red)] font-bold rounded-full shadow-lg border-2 border-[var(--primary-red)] transition duration-300 hover:bg-gray-50 hover:shadow-xl hover:scale-105 text-lg md:text-xl text-center"
            >
              Beachfront Getaways
            </a>
          </div>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <div className="px-4 py-2 bg-white rounded-full shadow-md">
              <span className="text-sm font-medium">✓ No booking fees</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-full shadow-md">
              <span className="text-sm font-medium">✓ Best price guarantee</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-full shadow-md">
              <span className="text-sm font-medium">✓ 24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path fill="#F5F5F5" d="M0 120L48 110C96 100 192 80 288 75C384 70 480 80 576 85C672 90 768 90 864 85C960 80 1056 70 1152 70C1248 70 1344 80 1392 85L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"/>
        </svg>
      </div>
    </section>
  );
}