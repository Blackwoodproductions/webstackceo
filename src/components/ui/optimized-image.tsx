import { useState, memo, ImgHTMLAttributes } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
}

const OptimizedImage = memo(({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  wrapperClassName,
  priority = false,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '100px',
    freezeOnceVisible: true,
  });

  const shouldLoad = priority || isVisible;
  const imageSrc = hasError ? fallback : src;

  return (
    <div 
      ref={ref}
      className={cn('relative overflow-hidden', wrapperClassName)}
    >
      {/* Placeholder skeleton */}
      {!isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 bg-secondary animate-pulse',
            className
          )} 
        />
      )}
      
      {shouldLoad && (
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding={decoding}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
