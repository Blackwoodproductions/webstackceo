import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

// Real brand-colored SVG icons
const WordPressIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.051-.18 2.986-.51a.485.485 0 01-.042-.08l-2.786-7.615zm-4.358-3.25c.043-.32.072-.664.072-1.035 0-.823-.154-1.416-.293-1.879-.181-.597-.376-1.1-.376-1.699 0-.667.506-1.286 1.22-1.286.032 0 .062.004.093.006A8.967 8.967 0 003.91 7.95l.096.002c.784 0 2-.095 2-.095.405-.024.452.571.048.618 0 0-.407.048-.859.071l2.735 8.137 1.643-4.928-1.169-3.209c-.405-.023-.788-.071-.788-.071-.405-.024-.357-.642.048-.618 0 0 1.24.095 1.976.095.784 0 2-.095 2-.095.405-.024.452.571.048.618 0 0-.407.048-.86.071l2.716 8.073.75-2.504zM12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm6.157 9.984c0 .71-.263 1.515-.607 2.649l-2.433 7.028c2.367-1.38 3.959-3.945 3.959-6.877 0-1.396-.361-2.709-.993-3.852.047.332.074.692.074 1.052z"/>
  </svg>
);

const ShopifyIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.756c-.022-.142-.153-.239-.294-.253-.143-.013-3.139-.232-3.139-.232s-2.075-2.013-2.298-2.236c-.058-.058-.136-.087-.223-.1l-1.063 23.876zm-2.863-16.676c-.267-.139-.556-.268-.867-.381.107-.35.199-.714.271-1.092.21.082.41.171.596.267l-.001 1.206zm-.938-3.236c.062-.323.108-.657.136-1.004.307.157.576.33.802.512l-.938.492zm.752-2.393c-.027.262-.065.515-.111.762-.275-.122-.568-.233-.878-.331.327-.154.659-.298.989-.431zm-1.19 8.143l-.466-3.1c.408.214.794.434 1.16.661-.217.81-.47 1.615-.694 2.439zm.633-5.233c.336.15.655.315.953.491l-.953.518v-.009l.001-1zm4.606 3.015c-.163-.04-.326-.082-.488-.127a18.075 18.075 0 00-.253-1.323c.296.098.562.205.796.318l-.055 1.132z"/>
  </svg>
);

const WixIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.2 7.998c-.458 0-.807.246-.974.59-.114.233-.149.434-.177.745l-.708 8.25s-.025.267-.133.433c-.107.166-.3.284-.57.284-.32 0-.538-.168-.63-.345-.087-.172-.11-.393-.11-.393L0 7.998h2.4l.35 4.084s.023.261.11.393c.092.177.31.345.63.345.27 0 .463-.118.57-.284.108-.166.133-.433.133-.433l.35-4.084h1.8l.35 4.084s.025.267.133.433c.107.166.3.284.57.284.32 0 .538-.168.63-.345.087-.132.11-.393.11-.393l.35-4.084H10l-.898 9.564s-.023.221-.11.393c-.092.177-.31.345-.63.345-.27 0-.463-.118-.57-.284-.108-.166-.133-.433-.133-.433l-.708-8.25c-.028-.311-.063-.512-.177-.745-.167-.344-.516-.59-.974-.59-.46 0-.807.246-.974.59-.114.233-.149.434-.177.745l-.708 8.25s-.025.267-.133.433c-.107.166-.3.284-.57.284zM14.4 8h2.4l1.2 4.8 1.2-4.8H21.6l-2.4 9.6h-2.4l-1.2-4.8-1.2 4.8h-2.4z"/>
  </svg>
);

const LovableIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const platforms: Platform[] = [
  {
    id: "wordpress",
    name: "WordPress",
    description: "Auto-publish posts",
    icon: <WordPressIcon />,
    gradient: "from-[#21759B] to-[#2E9AD0]", // WordPress blue
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Product content",
    icon: <ShopifyIcon />,
    gradient: "from-[#95BF47] to-[#7AB55C]", // Shopify green
  },
  {
    id: "wix",
    name: "Wix",
    description: "Dynamic pages",
    icon: <WixIcon />,
    gradient: "from-[#FAAD4D] to-[#F9C646]", // Wix yellow/gold
  },
  {
    id: "lovable",
    name: "Lovable",
    description: "Real-time stream",
    icon: <LovableIcon />,
    gradient: "from-[#8B5CF6] to-[#A855F7]", // Lovable purple
  },
];

interface CADEPlatformCardsProps {
  onSettingsClick?: () => void;
  connectedPlatforms?: string[];
  onPlatformClick?: (platformId: string) => void;
}

export const CADEPlatformCards = memo(({ 
  onSettingsClick, 
  connectedPlatforms = [],
  onPlatformClick 
}: CADEPlatformCardsProps) => {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-4">
      {/* Platform Cards Grid */}
      <div className="flex-1 grid grid-cols-4 gap-3 max-w-3xl">
        <AnimatePresence>
          {platforms.map((platform, i) => {
            const isConnected = connectedPlatforms.includes(platform.id);
            const isHovered = hoveredPlatform === platform.id;
            
            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                onMouseEnter={() => setHoveredPlatform(platform.id)}
                onMouseLeave={() => setHoveredPlatform(null)}
                onClick={() => onPlatformClick?.(platform.id)}
                className="relative group cursor-pointer"
              >
                <motion.div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl 
                    bg-white/5 border border-white/10 
                    transition-all duration-300
                    ${isConnected ? 'ring-2 ring-emerald-400/50' : ''}
                  `}
                  whileHover={{ 
                    scale: 1.03, 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Connected badge */}
                  {isConnected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg z-10"
                    >
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Icon with real brand colors */}
                  <motion.div 
                    className={`
                      w-10 h-10 rounded-lg bg-gradient-to-br ${platform.gradient}
                      flex items-center justify-center shadow-lg text-white
                    `}
                    animate={isHovered ? { 
                      rotate: [0, -5, 5, 0],
                      scale: [1, 1.1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {platform.icon}
                  </motion.div>
                  
                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <motion.span 
                      className="text-white font-medium text-sm block"
                      animate={isHovered ? { x: [0, 2, 0] } : {}}
                    >
                      {platform.name}
                    </motion.span>
                    <p className="text-white/50 text-xs truncate">{platform.description}</p>
                  </div>
                  
                  {/* Hover glow effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${platform.gradient} opacity-0 -z-10`}
                    animate={{ opacity: isHovered ? 0.15 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                
                {/* Animated underline on hover */}
                <motion.div
                  className={`absolute -bottom-0.5 left-1/2 h-0.5 bg-gradient-to-r ${platform.gradient} rounded-full`}
                  initial={{ width: 0, x: '-50%' }}
                  animate={{ 
                    width: isHovered ? '80%' : 0,
                    x: '-50%'
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Settings Button */}
      {onSettingsClick && (
        <motion.div
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl h-11 w-11 border border-white/15 flex-shrink-0"
            onClick={onSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
});

CADEPlatformCards.displayName = 'CADEPlatformCards';

export default CADEPlatformCards;
