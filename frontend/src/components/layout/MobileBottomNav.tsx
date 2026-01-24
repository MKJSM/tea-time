
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Package } from 'lucide-react';
import { cn } from '../../utils/cn';

const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();

  const navItems = [
    { icon: Search, label: 'Collection', path: '/shop' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
    { icon: Package, label: 'Orders', path: '/orders' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/shop' && pathname === '/');
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all",
                isActive ? "text-tea-700 scale-110" : "text-gray-400 hover:text-tea-600"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-tea-100")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
