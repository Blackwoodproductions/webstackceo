import { memo, useState, useEffect } from "react";

const FloatingCodeBox = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Delay render to not block initial page paint
  useEffect(() => {
    let handle: number;
    const hasIdle = typeof window !== "undefined" && "requestIdleCallback" in window;

    if (hasIdle) {
      handle = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(() => setIsVisible(true), { timeout: 1000 });
    } else {
      handle = setTimeout(() => setIsVisible(true), 1) as unknown as number;
    }

    return () => {
      if (hasIdle) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, []);

  // Handle scroll to stop at bottom
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const stopPoint = window.innerHeight - 120; // Stop 120px from bottom
        setIsAtBottom(footerRect.top < stopPoint);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const codeLines = [
    'const ai =',
    '  analyze()',
    'if (ready)',
    '  deploy();',
    'return data',
    '};',
  ];

  return (
    <div 
      className="fixed right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer z-40 animate-fade-in"
      style={{
        top: isAtBottom ? 'auto' : '8rem',
        bottom: isAtBottom ? '120px' : 'auto',
      }}
    >
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
