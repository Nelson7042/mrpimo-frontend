"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Breadcrumb {
  name: string;
  slug: string;
  categoryId: string;
}

interface BreadcrumbTrailProps {
  breadcrumbs: Breadcrumb[];
  className?: string;
}

const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({
  breadcrumbs,
  className = "",
}) => {
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`text-sm ${className}`} aria-label="Category breadcrumb">
      <ul className="flex items-center flex-wrap">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/home"
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            <span className="ml-1">Home</span>
          </Link>
          <span className="mx-1 md:mx-2 flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </span>
        </li>

        {/* Categories link */}
        <li className="flex items-center">
          <Link
            href="/home/categories"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:underline"
          >
            Categories
          </Link>
          <span className="mx-1 md:mx-2 flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </span>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.categoryId} className="flex items-center">
              {isLast ? (
                <span className="text-blue-500 font-medium" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={`/home/categories/${crumb.slug}?categoryId=${crumb.categoryId}`}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:underline"
                >
                  {crumb.name}
                </Link>
              )}
              {!isLast && (
                <span className="mx-1 md:mx-2 flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BreadcrumbTrail;
