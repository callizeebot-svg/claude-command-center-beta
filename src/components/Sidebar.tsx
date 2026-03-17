'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  Puzzle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  BarChart2,
  CalendarClock,
  Zap,
  Columns,
  Moon,
  Sun,
  Archive,
  Brain,
  CircleHelp,
  Monitor,
} from 'lucide-react';

// Custom icon component for Pallet Town using the pokemon logo
const PalletTownIcon = ({ className }: { className?: string }) => (
  <img src="/pokemon/p.png" alt="" className={className} style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />
);
import { useStore } from '@/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', shortcut: '1' },
  { href: '/agents', icon: Bot, label: 'Agents', shortcut: '2' },
  { href: '/kanban', icon: Columns, label: 'Kanban', shortcut: '3' },
  { href: '/vault', icon: Archive, label: 'Vault', shortcut: '4' },
  { href: '/projects', icon: FolderKanban, label: 'Projects', shortcut: '5' },
  { href: '/skills', icon: Sparkles, label: 'Skills', shortcut: '6' },
  { href: '/plugins', icon: Puzzle, label: 'Plugins', shortcut: '7' },
  { href: '/recurring-tasks', icon: CalendarClock, label: 'Scheduled Tasks', shortcut: '8' },
  { href: '/automations', icon: Zap, label: 'Automations', shortcut: '9' },
  { href: '/usage', icon: BarChart2, label: 'Usage', shortcut: '0' },
  { href: '/memory', icon: Brain, label: 'Memory', shortcut: 'M' },
  { href: '/workspace', icon: Monitor, label: 'Workspace', shortcut: 'W' },
  { href: '/pallet-town', icon: PalletTownIcon, label: 'ClaudeMon' },
];

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, darkMode, toggleDarkMode, vaultUnreadCount } = useStore();
  const helpUrl = 'https://www.skool.com/claude';

  // For mobile, sidebar is always expanded (240px) when open
  const sidebarWidth = isMobile ? 240 : (sidebarCollapsed ? 72 : 240);
  const showLabels = isMobile || !sidebarCollapsed;

  // Close mobile menu when navigating
  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const openHelp = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.electronAPI?.updates?.openExternal) {
      void window.electronAPI.updates.openExternal(helpUrl);
      return;
    }

    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  };

  // Desktop sidebar
  if (!isMobile) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen bg-[linear-gradient(180deg,var(--bg-secondary),var(--bg-primary))] border-r border-r-border-primary/90 flex-col z-50 hidden lg:flex shadow-[12px_0_32px_rgba(52,45,34,0.05)]"
      >
        {/* Drag region - covers macOS traffic light area */}
        <div className="window-drag h-7 shrink-0" />
        {/* Logo */}
        <div className="h-18 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] overflow-hidden shrink-0 border border-border-primary bg-bg-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <img src="/command-center-mark.png" alt="Samins Command Center" className="w-full h-full object-cover" />
            </div>
            {showLabels && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">Command Center</p>
                <img src="/command-center-wordmark.png" alt="Samins Command Center" className="h-6 w-auto object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition-all duration-150 border border-transparent
                  ${isActive
                    ? 'bg-primary/12 text-primary font-medium border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border-primary/80'
                  }
                `}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.href === '/vault' && vaultUnreadCount > 0 && !showLabels && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold bg-primary text-primary-foreground rounded-full px-0.5">
                      {vaultUnreadCount}
                    </span>
                  )}
                </div>
                {showLabels && (
                  <span className="text-sm flex-1">
                    {item.label}
                  </span>
                )}
                {item.href === '/vault' && vaultUnreadCount > 0 && showLabels && (
                  <span className="min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1">
                    {vaultUnreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        {showLabels && (
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 rounded-[14px] border border-border-primary bg-bg-elevated/90 px-3 py-2 text-xs text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
              </span>
              <span>Connected</span>
            </div>
          </div>
        )}

        {/* Settings & Collapse */}
        <div className="border-t border-border">
          <button
            type="button"
            onClick={openHelp}
            title="Need Help?"
            className="mx-3 mt-3 flex w-auto items-center gap-3 rounded-[14px] px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <CircleHelp className="w-5 h-5" />
            {showLabels && <span className="text-sm">Need Help?</span>}
          </button>
          <Link
            href="/settings"
            className={`
              mx-3 my-1 flex items-center gap-3 rounded-[14px] px-3 py-3 transition-colors border border-transparent
              ${pathname === '/settings' || pathname.startsWith('/settings/')
                ? 'bg-primary/12 text-primary border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            {showLabels && <span className="text-sm">Settings</span>}
          </Link>
          <button
            onClick={toggleDarkMode}
            className="mx-3 my-1 flex w-auto items-center gap-3 rounded-[14px] px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {showLabels && <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={toggleSidebar}
            className="mx-3 mb-3 mt-1 flex w-auto items-center gap-3 rounded-[14px] px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    );
  }

  // Mobile sidebar (drawer)
  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.aside
          initial={{ x: -sidebarWidth }}
          animate={{ x: 0 }}
          exit={{ x: -sidebarWidth }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="fixed left-0 top-0 h-screen bg-[linear-gradient(180deg,var(--bg-secondary),var(--bg-primary))] border-r border-border flex flex-col z-50 lg:hidden shadow-[12px_0_32px_rgba(52,45,34,0.08)]"
          style={{ width: sidebarWidth }}
        >
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] overflow-hidden shrink-0 border border-border-primary bg-bg-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                <img src="/command-center-mark.png" alt="Samins Command Center" className="w-full h-full object-cover" />
              </div>
              <img src="/command-center-wordmark.png" alt="Samins Command Center" className="h-6 w-auto object-contain" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`
                    group flex items-center gap-3 rounded-[14px] px-3 py-2.5 transition-all duration-150 border border-transparent
                    ${isActive
                      ? 'bg-primary/12 text-primary font-medium border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }
                  `}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm flex-1">
                    {item.label}
                  </span>
                  {item.href === '/vault' && vaultUnreadCount > 0 && (
                    <span className="min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1">
                      {vaultUnreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status indicator */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 rounded-[14px] border border-border-primary bg-bg-elevated/90 px-3 py-2 text-xs text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
              </span>
              <span>Connected</span>
            </div>
          </div>

          {/* Settings & Theme Toggle */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => {
                openHelp();
                handleNavClick();
              }}
              className="mx-3 mt-3 flex w-auto items-center gap-3 rounded-[14px] px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <CircleHelp className="w-5 h-5" />
              <span className="text-sm">Need Help?</span>
            </button>
            <Link
              href="/settings"
              onClick={handleNavClick}
              className={`
                mx-3 my-1 flex items-center gap-3 rounded-[14px] px-3 py-3 transition-colors border border-transparent
                ${pathname === '/settings' || pathname.startsWith('/settings/')
                  ? 'bg-primary/12 text-primary border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </Link>
            <button
              onClick={toggleDarkMode}
              className="mx-3 mb-3 mt-1 flex w-auto items-center gap-3 rounded-[14px] px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
