import React from 'react';
import { Home, Search, ShoppingCart, User, Heart, Menu } from 'lucide-react';
import Link from 'next/link';
import { useCartLength } from '@/stores/cartHook';
import { usePathname } from 'next/navigation';

interface MobileNavigationProps {
  onMenuClick?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onMenuClick }) => {
  const cartLength = useCartLength();
  const pathname = usePathname();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/home',
      active: pathname === '/home',
    },
    {
      icon: Search,
      label: 'Search',
      href: '/home/search',
      active: pathname.includes('/search'),
    },
    {
      icon: ShoppingCart,
      label: 'Cart',
      href: '/home/my-cart',
      active: pathname.includes('/my-cart'),
      badge: cartLength,
    },
    {
      icon: Heart,
      label: 'Wishlist',
      href: '/home/wishlist',
      active: pathname.includes('/wishlist'),
    },
    {
      icon: User,
      label: 'Profile',
      href: '/home/user',
      active: pathname.includes('/user'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 relative ${
                item.active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              } transition-colors duration-200`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation;