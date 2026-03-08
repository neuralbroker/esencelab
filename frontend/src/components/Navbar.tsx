'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EsencelabLogo from '@/components/EsencelabLogo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'student':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/jobs', label: 'Jobs' },
          { href: '/courses', label: 'Courses' },
          { href: '/resume', label: 'Resume' },
          { href: '/applications', label: 'Applications' },
        ];
      case 'employer':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/jobs', label: 'Jobs' },
          { href: '/applicants', label: 'Applicants' },
        ];
      case 'admin':
        return [
          { href: '/dashboard', label: 'Overview' },
          { href: '/admin/resumes', label: 'Resumes' },
          { href: '/jobs', label: 'Jobs' },
          { href: '/users', label: 'Users' },
          { href: '/applicants', label: 'Applicants' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/72 bg-white/62 backdrop-blur-xl">
      <div className="layout-container">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="inline-flex">
            <EsencelabLogo />
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-white/72 bg-white/64 px-2 py-1 text-[0.72rem] font-semibold text-[#111111] shadow-[0_14px_28px_-22px_rgba(20,20,20,0.65)] md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    isActive ? 'bg-white/84 text-primary' : 'text-secondary hover:bg-white/74 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center md:flex" ref={profileRef}>
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2.5 rounded-full border border-white/72 bg-white/64 pl-1.5 pr-3 py-1 transition-colors hover:bg-white/78"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 rounded-full bg-[#f0f0f0] text-[#111111] flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate text-sm font-medium text-primary">{user?.name}</span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/72 bg-white/82 py-2 text-primary shadow-[0_18px_34px_-28px_rgba(22,22,22,0.7)] backdrop-blur-md"
                  >
                    <div className="mb-1 border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-medium">{user?.name}</p>
                      <p className="mt-0.5 text-xs capitalize text-secondary">{user?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-primary transition-colors hover:bg-white/70 md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-white/72 bg-white/82 backdrop-blur-md overflow-hidden"
          >
            <div className="space-y-1 px-4 pb-4 pt-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-white/84 text-primary' : 'text-secondary hover:bg-white/74 hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-white/72 pt-2"></div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

