import { useState, useEffect } from 'react';

interface AnimatedTaglineProps {
  className?: string;
}

const taglines = [
  "by Blackwood Productions",
  "A Lovable application"
];

export function AnimatedTagline({ className = "" }: AnimatedTaglineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsVisible(false);
      
      // After fade out, switch text and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % taglines.length);
        setIsVisible(true);
      }, 500); // Match the CSS transition duration
    }, 4000); // Switch every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <span 
      className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {taglines[currentIndex]}
    </span>
  );
}
