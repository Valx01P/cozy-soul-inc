

// Hamburger Menu Icon Component
export const HamburgerMenu = ({ 
  className = '', 
  color = 'currentColor',
  strokeWidth = 1.5, 
  size = 24 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 30 30" 
      fill="none" 
      stroke={color}
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`${className}`}
    >
      {/* Three horizontal lines for hamburger menu */}
      <line x1="6" y1="8" x2="24" y2="8" />
      <line x1="6" y1="15" x2="24" y2="15" />
      <line x1="6" y1="22" x2="24" y2="22" />
    </svg>
  );
};

// X Icon Component (Close Button)
export const XIcon = ({ 
  className = '', 
  color = 'currentColor',
  strokeWidth = 1.5, 
  size = 24 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 30 30" 
      fill="none" 
      stroke={color}
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`${className}`}
    >
      {/* Two diagonal lines forming an X */}
      <line x1="7" y1="7" x2="23" y2="23" />
      <line x1="23" y1="7" x2="7" y2="23" />
    </svg>
  );
};

export const Search = ({ 
  className = '', 
  color = 'currentColor',
  strokeWidth = 1.5, 
  size = 24 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 30 30" 
      fill="none" 
      stroke={color}
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`${className}`}
    >
      {/* Circle for the lens */}
      <circle cx="11" cy="11" r="7" />
      
      {/* Long handle extending from bottom left of the lens */}
      <line x1="20" y1="25" x2="15" y2="17" />
    </svg>
  );
};
