/**
 * Performance-Optimized Container Component
 * 
 * Applies CSS containment and GPU acceleration to prevent layout thrashing.
 * Use for high-frequency render components or sections prone to flickering.
 */

import { memo, forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ContainmentLevel = 'none' | 'layout' | 'style' | 'paint' | 'strict' | 'content';

interface OptimizedContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** CSS containment level - use 'strict' for maximum isolation */
  contain?: string;
  /** Enable GPU acceleration for transforms */
  gpuAccelerated?: boolean;
  /** Prevent theme transition animations */
  noThemeTransition?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A container component with built-in performance optimizations.
 * 
 * @example
 * // High-frequency updating component
 * <OptimizedContainer contain="layout style" gpuAccelerated>
 *   <LiveMetricsDisplay />
 * </OptimizedContainer>
 * 
 * @example
 * // Isolated section that shouldn't affect parent layout
 * <OptimizedContainer contain="strict">
 *   <ComplexVisualization />
 * </OptimizedContainer>
 */
export const OptimizedContainer = memo(forwardRef<HTMLDivElement, OptimizedContainerProps>(({
  children,
  contain = 'layout style',
  gpuAccelerated = false,
  noThemeTransition = false,
  className,
  style,
  ...props
}, ref) => {
  const containStyle: React.CSSProperties = {
    contain,
    ...(gpuAccelerated && {
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      willChange: 'transform',
    }),
    ...style,
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={containStyle}
      data-no-theme-transition={noThemeTransition || undefined}
      {...props}
    >
      {children}
    </div>
  );
}));

OptimizedContainer.displayName = 'OptimizedContainer';

/**
 * A wrapper for lists that prevents layout thrashing during updates.
 */
export const OptimizedList = memo(forwardRef<HTMLDivElement, OptimizedContainerProps>(({
  children,
  className,
  ...props
}, ref) => (
  <OptimizedContainer
    ref={ref}
    contain="layout style paint"
    className={cn('will-change-auto', className)}
    {...props}
  >
    {children}
  </OptimizedContainer>
)));

OptimizedList.displayName = 'OptimizedList';

/**
 * A card wrapper with paint containment for complex content.
 */
export const OptimizedCard = memo(forwardRef<HTMLDivElement, OptimizedContainerProps>(({
  children,
  className,
  ...props
}, ref) => (
  <OptimizedContainer
    ref={ref}
    contain="layout paint"
    className={cn('rounded-xl', className)}
    {...props}
  >
    {children}
  </OptimizedContainer>
)));

OptimizedCard.displayName = 'OptimizedCard';

export default OptimizedContainer;