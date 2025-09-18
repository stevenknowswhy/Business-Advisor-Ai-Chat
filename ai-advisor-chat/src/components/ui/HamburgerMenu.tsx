"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "~/contexts/SidebarContext";

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className = "" }: HamburgerMenuProps) {
  const { isCollapsed, isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  // Track screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Determine which action to take based on screen size
  const handleClick = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  // Determine the current state for animation
  const isOpen = isMobile ? isMobileOpen : !isCollapsed;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${className}`}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      title={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <div className="w-full flex flex-col items-center justify-center">
          {/* Top line */}
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "rotate-45 translate-y-1.5" : "mb-1"
            }`}
          />
          {/* Middle line */}
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "opacity-0" : "mb-1"
            }`}
          />
          {/* Bottom line */}
          <div
            className={`w-5 h-0.5 bg-current transition-all duration-300 ease-in-out ${
              isOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          />
        </div>
      </div>
    </button>
  );
}
