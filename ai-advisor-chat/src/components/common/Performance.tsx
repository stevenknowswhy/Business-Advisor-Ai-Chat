import React from 'react';

/**
 * Lazy loading component with fallback UI
 */
export function LazyComponent({
  children,
  fallback,
  ...props
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  );
}

/**
 * Higher-order component for lazy loading with error boundary
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyWrappedComponent = React.lazy(() => Promise.resolve({ default: Component }));

  return function WithLazyLoading(props: P) {
    return (
      <LazyComponent fallback={fallback}>
        <LazyWrappedComponent {...props} />
      </LazyComponent>
    );
  };
}

/**
 * Intersection Observer hook for infinite scrolling
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const [lastElement, setLastElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!lastElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(lastElement);

    return () => {
      observer.disconnect();
    };
  }, [lastElement, callback, options]);

  return setLastElement;
}

/**
 * Debounced hook for search and filter inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} rendered in ${duration.toFixed(2)}ms`);
      }

      // In production, send to analytics service
      if (process.env.NODE_ENV === 'production' && duration > 100) {
        // TODO: Send to analytics service
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    };
  }, [componentName]);
}