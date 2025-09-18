"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  delay = 500, 
  disabled = false,
  className = "" 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position: to the right of the trigger
    let top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
    let left = triggerRect.right + 12; // 12px spacing

    // Adjust if tooltip would overflow viewport
    if (left + tooltipRect.width > viewportWidth) {
      // Position to the left instead
      left = triggerRect.left - tooltipRect.width - 12;
    }

    // Adjust vertical position if needed
    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible]);

  // Only show tooltips on desktop/tablet (≥768px)
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768 && isVisible) {
        hideTooltip();
      }
    };

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className={`relative ${className}`}
        aria-describedby={isVisible ? "tooltip" : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className="fixed z-[9999] max-w-[250px] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200 ease-in-out"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: isVisible ? 1 : 0,
          }}
        >
          {content}
          
          {/* Arrow pointing to the trigger */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"
            style={{
              left: position.left > triggerRef.current?.getBoundingClientRect().right! ? 
                "calc(100% - 4px)" : "-4px"
            }}
          />
        </div>
      )}
    </>
  );
}
