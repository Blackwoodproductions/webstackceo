import { memo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const FloatingCodeBox = memo(() => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  // Don't show on homepage - it has its own code box in HeroSection
  const isHomepage = location.pathname === "/";

  // Delay render to not block initial page paint
  useEffect(() => {
    if (isHomepage) return;
    const timer = requestIdleCallback(() => setIsVisible(true), { timeout: 1000 });
    return () => cancelIdleCallback(timer);
  }, [isHomepage]);

  if (isHomepage || !isVisible) return null;

  const codeLines = [
    'const ai =',
    '  analyze()',
    'if (ready)',
    '  deploy();',
    'return data',
    '};',
  ];

  return (
    <div className="fixed top-32 right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer z-40 animate-fade-in">
      <div className="absolute inset-0 flex flex-col py-1.5 px-1.5">
        {codeLines.map((codeLine, rowIndex) => (
          <div 
            key={rowIndex} 
            className="text-primary text-[7px] font-mono leading-[11px] overflow-hidden"
          >
            <span 
              className="inline-block floating-code-line"
              style={{ 
                textShadow: '0 0 6px hsl(var(--primary) / 0.7)',
                animationDelay: `${rowIndex * 0.5}s`,
              }}
            >
              {codeLine}
            </span>
            <span 
              className="inline-block w-[3px] h-[8px] bg-primary ml-[1px] align-middle floating-code-cursor"
              style={{
                animationDelay: `${rowIndex * 0.5}s`,
                boxShadow: '0 0 4px hsl(var(--primary) / 0.8)'
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        .floating-code-line {
          animation: floatingCodeTypewrite 3s steps(12) infinite;
          width: 0;
          overflow: hidden;
          white-space: nowrap;
        }
        .floating-code-cursor {
          animation: floatingCodeBlink 0.8s step-end infinite;
        }
        @keyframes floatingCodeTypewrite {
          0%, 100% { width: 0; }
          50%, 90% { width: 100%; }
        }
        @keyframes floatingCodeBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});

FloatingCodeBox.displayName = "FloatingCodeBox";

export default FloatingCodeBox;
