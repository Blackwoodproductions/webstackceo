import { memo } from "react";
import { motion } from "framer-motion";

const FloatingCodeBox = memo(() => {
  const codeLines = [
    'const ai =',
    '  analyze()',
    'if (ready)',
    '  deploy();',
    'return data',
    '};',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="fixed top-32 right-6 w-20 h-20 rounded-xl glass-card hidden lg:flex overflow-hidden cursor-pointer z-40 hover:scale-105 transition-transform duration-300"
    >
      <div className="absolute inset-0 flex flex-col py-1.5 px-1.5">
        {codeLines.map((codeLine, rowIndex) => (
          <div 
            key={rowIndex} 
            className="text-amber-400 text-[7px] font-mono leading-[11px] overflow-hidden"
          >
            <span 
              className="inline-block"
              style={{ 
                textShadow: '0 0 6px rgba(251, 191, 36, 0.7)',
                animation: `floatingCodeTypewrite 3s steps(${codeLine.length}) infinite`,
                animationDelay: `${rowIndex * 0.5}s`,
                width: '0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {codeLine}
            </span>
            <span 
              className="inline-block w-[3px] h-[8px] bg-amber-400 ml-[1px] align-middle"
              style={{
                animation: `floatingCodeBlink 0.8s step-end infinite`,
                animationDelay: `${rowIndex * 0.5}s`,
                boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)'
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes floatingCodeTypewrite {
          0%, 100% { width: 0; }
          50%, 90% { width: 100%; }
        }
        @keyframes floatingCodeBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
});

FloatingCodeBox.displayName = "FloatingCodeBox";

export default FloatingCodeBox;
