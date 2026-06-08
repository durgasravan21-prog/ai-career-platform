"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Bell,
  Trash2,
  CheckCheck,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/mentors", label: "Mentors", icon: Users },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const fetchNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      const handleUpdate = () => {
        fetchNotifications();
      };
      
      window.addEventListener("mock_notifications_updated", handleUpdate);
      return () => {
        window.removeEventListener("mock_notifications_updated", handleUpdate);
      };
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.notifications.clearAll();
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Don't show navbar on onboarding
  if (pathname?.startsWith("/onboarding")) return null;

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold gradient-text">CareerAI</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-foreground"
                        : "text-muted hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileDropdownOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-white/5 transition-all duration-200"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-white/10 rounded-2xl shadow-xl z-20 animate-slideDown overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">Notifications</p>
                          <div className="flex gap-2 text-[10px]">
                            {notifications.length > 0 && (
                              <>
                                <button
                                  onClick={handleMarkAllRead}
                                  className="text-primary hover:underline flex items-center gap-0.5"
                                >
                                  <CheckCheck className="w-3 h-3" /> Read All
                                </button>
                                <button
                                  onClick={handleClearAll}
                                  className="text-error hover:underline flex items-center gap-0.5"
                                >
                                  <Trash2 className="w-3 h-3" /> Clear
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-xs text-muted">
                              No new notifications
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={cn(
                                  "p-3 text-xs space-y-1 transition-colors",
                                  !notif.read ? "bg-white/[0.02]" : "opacity-70"
                                )}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className={cn(
                                    "font-semibold text-left",
                                    notif.type === "warning" ? "text-warning" : "text-foreground"
                                  )}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                    {new Date(notif.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-muted leading-normal text-left">{notif.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm text-foreground">
                    {user.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-xl z-20 animate-slideDown overflow-hidden">
                      <div className="p-3 border-b border-white/5">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/?login=true"
                  className="inline-flex items-center justify-center font-medium transition-all duration-200 px-3 py-1.5 text-sm rounded-lg gap-1.5 text-foreground hover:bg-white/5"
                >
                  Login
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center font-medium transition-all duration-200 px-3 py-1.5 text-sm rounded-lg gap-1.5 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 hover:brightness-110 active:brightness-95"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors text-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-surface/95 backdrop-blur-xl animate-slideDown">
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-white/10 text-foreground"
                          : "text-muted hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/?login=true"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-muted hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center font-medium transition-all duration-200 px-3 py-1.5 text-sm rounded-lg gap-1.5 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/25 hover:brightness-110 active:brightness-95 w-full mt-2"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
