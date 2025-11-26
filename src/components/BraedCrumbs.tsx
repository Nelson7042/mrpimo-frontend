
import React, { useState, ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';

// Types
export interface BreadcrumbItem {
  label: string;
  href: string | null;
  isActive?: boolean;
  isEllipsis?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  showHome?: boolean;
  homeIcon?: ReactNode;
  maxItems?: number | null;
  className?: string;
  onItemClick?: (item: BreadcrumbItem, event: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface PathMapping {
  [key: string]: string;

}

// Main Breadcrumbs Component
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items = [], 

  separator = <ChevronRight className="w-4 h-4 text-gray-400" />,
  showHome = true,
  homeIcon = <Home className="w-4 h-4" />,
  maxItems = null,
  className = "",
  onItemClick = null
}) => {
  // Handle truncation for long breadcrumb chains
  const getDisplayItems = (): BreadcrumbItem[] => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }
    
    if (maxItems <= 3) {
      return [
        items[0],
        { label: '...', href: null, isEllipsis: true },
        ...items.slice(-1)
      ];
    }
    
    const start = items.slice(0, 1);
    const end = items.slice(-(maxItems - 2));
    return [
      ...start,
      { label: '...', href: null, isEllipsis: true },
      ...end
    ];

  };

  const displayItems = getDisplayItems();

  const handleItemClick = (item: BreadcrumbItem, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (item.isEllipsis || !item.href) {
      e.preventDefault();
      return;
    }
    
    if (onItemClick) {
      onItemClick(item, e);
    }
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {/* Home Item */}
        {showHome && (
          <li className='flex items-center'>
            <a
              href="/home"
              onClick={(e) => handleItemClick({ label: 'Home', href: '/home' }, e)}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Home"
            >
              {homeIcon} <span className="ml-1">Home</span> 
            </a>
            {items.length > 0 && (
              <span className="mx-2 flex items-center ">
                {separator}
              </span>
            )}
          </li>
        )}

        {/* Breadcrumb Items */}
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.isEllipsis ? (
              <span className="text-gray-400 px-2 flex items-center">...</span>
            ) : (
              <>
                {item.href && index < displayItems.length - 1 ? (
                  <a
                    href={item.href}
                    onClick={(e) => handleItemClick(item, e)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:underline flex items-center"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-blue-500 font-medium flex items-center" aria-current="page">
                    {item.label}
                  </span>
                )}
              </>
            )}
            
            {/* Separator */}
            {index < displayItems.length - 1 && !item.isEllipsis && (
              <span className="mx-2 flex items-center">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Hook for generating breadcrumbs from URL path
const useBreadcrumbsFromPath = (
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/', 
  pathMapping: PathMapping = {}
): BreadcrumbItem[] => {
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs: BreadcrumbItem[] = [];
    
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Use mapping if provided, otherwise format segment
      const label = pathMapping[currentPath] || 
                   pathMapping[segment] || 
                   segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: index === pathSegments.length - 1
      });
    });
    
    return breadcrumbs;
  };

  return generateBreadcrumbs();
};

export {
Breadcrumbs, useBreadcrumbsFromPath
}