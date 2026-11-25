"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Compass,
  Lightbulb,
  Moon,
  Plane,
  RotateCcw,
  Share2,
  Sun,
  Wallet,
} from "lucide-react";
import CollaborateModal from "@/components/CollaborateModal";
import type { Trip } from "@/types/trip";

interface PlanShellProps {
  trips: Trip[];
  activeTrip: Trip;
  onSelectTrip: (id: string) => void;
  onUpdateTrip: (updater: (trip: Trip) => Trip) => void;
  onResetDemo: () => void;
  children: React.ReactNode;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export default function PlanShell({
  trips,
  activeTrip,
  onSelectTrip,
  onUpdateTrip,
  onResetDemo,
  children,
}: PlanShellProps) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  const q = `?trip=${encodeURIComponent(activeTrip.id)}`;
  const navItems = [
    { href: `/plan${q}`, base: "/plan", label: "Itinerary & Map", Icon: CalendarDays },
    { href: `/plan/transit${q}`, base: "/plan/transit", label: "Travel Options", Icon: Plane },
    { href: `/plan/suggestions${q}`, base: "/plan/suggestions", label: "Suggestions", Icon: Lightbulb },
    { href: `/plan/budget${q}`, base: "/plan/budget", label: "Budget", Icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#18222f] transition-colors dark:bg-[#0f1419] dark:text-[#eef2f5]">
      <header className="sticky top-0 z-30 border-b border-[#dde3e7] bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d6dfe5] bg-[#f7f9fa] px-2.5 py-1.5 text-xs font-medium text-[#3b4d5e] hover:bg-[#e9eff3] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6edf2] text-[#1e3a5f] dark:bg-slate-800 dark:text-sky-300">
                <Compass className="h-4 w-4" />
              </span>
              <span className="text-base font-bold tracking-tight">GHUMO</span>
            </Link>

            <select
              value={activeTrip.id}
              onChange={(e) => onSelectTrip(e.target.value)}
              aria-label="Select trip"
              className="ml-1 max-w-[200px] truncate rounded-lg border border-[#d6dfe5] bg-[#f7f9fa] px-2.5 py-1.5 text-xs font-medium text-[#18222f] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCollabModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6dfe5] bg-white px-3 py-1.5 text-xs font-medium text-[#3b4d5e] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>

            <button
              type="button"
              onClick={onResetDemo}
              title="Reset demo trips"
              className="inline-flex items-center gap-1 rounded-lg border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#546575] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              title="Toggle theme"
              className="rounded-lg border border-[#d6dfe5] bg-white p-1.5 text-[#546575] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {navItems.map(({ href, base, label, Icon }) => {
            const active = pathname === base;
            return (
              <Link
                key={base}
                href={href}
                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#1e3a5f] text-[#1e3a5f] dark:border-sky-400 dark:text-sky-300"
                    : "border-transparent text-[#5c6d7d] hover:text-[#18222f] dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>

      {showCollabModal && (
        <CollaborateModal
          trip={activeTrip}
          onClose={() => setShowCollabModal(false)}
          onInviteMember={(email, role) => {
            const namePart = email.split("@")[0] || "Guest";
            const formattedName =
              namePart.charAt(0).toUpperCase() + namePart.slice(1);
            onUpdateTrip((t) => ({
              ...t,
              collaborators: [
                ...t.collaborators,
                {
                  id: uid("col"),
                  name: formattedName,
                  email,
                  role,
                  avatarColor: "#1e3a5f",
                  initials: formattedName.slice(0, 2).toUpperCase(),
                },
              ],
            }));
          }}
          onAddComment={(text) => {
            const author = activeTrip.collaborators[0];
            onUpdateTrip((t) => ({
              ...t,
              comments: [
                ...t.comments,
                {
                  id: uid("com"),
                  authorId: author?.id ?? "you",
                  authorName: author?.name ?? "You",
                  text,
                  createdAt: "Just now",
                },
              ],
            }));
          }}
        />
      )}
    </div>
  );
}
