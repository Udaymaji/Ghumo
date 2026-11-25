"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Compass,
  Loader2,
  MapPin,
  Moon,
  Sun,
} from "lucide-react";
import { MOCK_TRIPS } from "@/data/mockTrips";
import { autoPlanTripDays } from "@/lib/autoPlanner";
import { searchPlaces, type PlaceResult } from "@/lib/geocoding";
import { formatMoney, getDayCount } from "@/lib/tripUtils";
import { STORAGE_ACTIVE_KEY, STORAGE_TRIPS_KEY } from "@/lib/useTripsStore";
import type { GeoCoords, Trip } from "@/types/trip";

const POPULAR_ROUTES: Array<{
  label: string;
  origin: string;
  originCoords: GeoCoords;
  destination: string;
  destCoords: GeoCoords;
  budget: number;
}> = [
  {
    label: "Delhi → Jaipur",
    origin: "New Delhi, India",
    originCoords: { lat: 28.6139, lng: 77.209 },
    destination: "Jaipur, Rajasthan",
    destCoords: { lat: 26.9124, lng: 75.7873 },
    budget: 25000,
  },
  {
    label: "Mumbai → Goa",
    origin: "Mumbai, Maharashtra",
    originCoords: { lat: 19.076, lng: 72.8777 },
    destination: "North Goa, Goa",
    destCoords: { lat: 15.4922, lng: 73.7736 },
    budget: 30000,
  },
  {
    label: "Bengaluru → Hampi",
    origin: "Bengaluru, Karnataka",
    originCoords: { lat: 12.9716, lng: 77.5946 },
    destination: "Hampi, Karnataka",
    destCoords: { lat: 15.335, lng: 76.46 },
    budget: 18000,
  },
  {
    label: "Delhi → Manali",
    origin: "New Delhi, India",
    originCoords: { lat: 28.6139, lng: 77.209 },
    destination: "Manali, Himachal Pradesh",
    destCoords: { lat: 32.2432, lng: 77.1892 },
    budget: 28000,
  },
  {
    label: "Delhi → Tokyo",
    origin: "New Delhi, India",
    originCoords: { lat: 28.6139, lng: 77.209 },
    destination: "Tokyo, Japan",
    destCoords: { lat: 35.6762, lng: 139.6503 },
    budget: 140000,
  },
];

export default function HomeLauncher() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [savedTrips, setSavedTrips] = useState<Trip[]>(MOCK_TRIPS);

  const [origin, setOrigin] = useState("New Delhi, India");
  const [originCoords, setOriginCoords] = useState<GeoCoords>({
    lat: 28.6139,
    lng: 77.209,
  });
  const [destination, setDestination] = useState("Manali, Himachal Pradesh");
  const [destCoords, setDestCoords] = useState<GeoCoords | null>({
    lat: 32.2432,
    lng: 77.1892,
  });
  const [startDate, setStartDate] = useState("2026-12-20");
  const [endDate, setEndDate] = useState("2026-12-22");
  const [budget, setBudget] = useState("30000");
  const [autoPlanWholeTrip, setAutoPlanWholeTrip] = useState(true);

  const dayCount = getDayCount(startDate, endDate);

  const [originResults, setOriginResults] = useState<PlaceResult[]>([]);
  const [destResults, setDestResults] = useState<PlaceResult[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(STORAGE_TRIPS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Trip[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedTrips(parsed);
          }
        }
      } catch {
        // Ignore storage errors
      }
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  const handleLookupOrigin = async (val: string) => {
    setOrigin(val);
    if (val.trim().length < 3) {
      setOriginResults([]);
      return;
    }
    try {
      const res = await searchPlaces(val);
      setOriginResults(res.slice(0, 4));
    } catch {
      setOriginResults([]);
    }
  };

  const handleLookupDest = async (val: string) => {
    setDestination(val);
    setDestCoords(null);
    if (val.trim().length < 3) {
      setDestResults([]);
      return;
    }
    try {
      const res = await searchPlaces(val);
      setDestResults(res.slice(0, 4));
    } catch {
      setDestResults([]);
    }
  };

  const handleLaunchPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setLoadingRoute(true);

    let resolvedOrigin = originCoords;
    let resolvedDest = destCoords;

    try {
      if (!resolvedDest) {
        const dRes = await searchPlaces(destination.trim());
        if (dRes.length > 0) resolvedDest = dRes[0].coords;
      }
      const oRes = await searchPlaces(origin.trim());
      if (oRes.length > 0) resolvedOrigin = oRes[0].coords;
    } catch {
      // Fallback to existing coordinates
    }

    const finalDest = resolvedDest ?? { lat: 26.9124, lng: 75.7873 };
    const newId = `trip-${Date.now().toString(36)}`;
    const destShort = destination.split(",")[0].trim();
    const originShort = origin.split(",")[0].trim();

    const days = autoPlanWholeTrip
      ? await autoPlanTripDays(destination.trim(), finalDest, startDate, dayCount)
      : Array.from({ length: dayCount }, (_, i) => ({
          id: `day-${Date.now().toString(36)}-${i + 1}`,
          dayNumber: i + 1,
          date: startDate,
          title: i === 0 ? `Arrival in ${destShort}` : `Day ${i + 1} in ${destShort}`,
          activities: [],
        }));

    const newTrip: Trip = {
      id: newId,
      name: `${originShort} to ${destShort}`,
      origin: origin.trim(),
      originCoords: resolvedOrigin,
      destination: destination.trim(),
      startDate,
      endDate,
      currency: "INR",
      totalBudget: Math.max(1000, Number(budget) || 25000),
      centerCoords: finalDest,
      coverEmoji: "",
      days,
      expenses: [],
      collaborators: [
        {
          id: "col-you",
          name: "You",
          email: "you@ghumo.in",
          role: "Owner",
          avatarColor: "#1e3a5f",
          initials: "YO",
        },
      ],
      comments: [],
    };

    const updated = [newTrip, ...savedTrips];
    try {
      localStorage.setItem(STORAGE_TRIPS_KEY, JSON.stringify(updated));
      localStorage.setItem(STORAGE_ACTIVE_KEY, newId);
    } catch {
      // Ignore quota errors
    }

    router.push(`/plan/transit?trip=${encodeURIComponent(newId)}`);
  };

  const openExistingTrip = (tripId: string) => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, tripId);
    } catch {
      // Ignore
    }
    router.push(`/plan?trip=${encodeURIComponent(tripId)}`);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#18222f] transition-colors dark:bg-[#0f1419] dark:text-[#eef2f5]">
      <header className="border-b border-[#dde3e7] bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6edf2] text-[#1e3a5f] dark:bg-slate-800 dark:text-sky-300">
              <Compass className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">GHUMO</span>
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            title="Toggle theme"
            className="rounded-lg border border-[#d6dfe5] bg-white p-2 text-slate-600 hover:bg-[#edf2f5] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#d7e0e6] bg-gradient-to-br from-[#e9eff3] via-[#f4f7f6] to-[#e9f0ec] p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="max-w-2xl space-y-2">
            <span className="inline-block rounded-full bg-[#dce7e2] px-2.5 py-0.5 text-[11px] font-semibold text-[#244c3c] dark:bg-emerald-950/60 dark:text-emerald-300">
              India Route & Trip Planner
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#142334] sm:text-4xl dark:text-white">
              Where are you going?
            </h1>
            <p className="text-sm text-[#4a5b6c] dark:text-slate-400">
              Enter your starting city and destination to compare flights,
              trains, buses, and plan each day in ₹ INR.
            </p>
          </div>

          <form
            onSubmit={handleLaunchPlan}
            className="mt-6 rounded-xl border border-[#d7e0e6] bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900"
          >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-stone-500">
                From
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => handleLookupOrigin(e.target.value)}
                  placeholder="New Delhi"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-8 pr-3 text-sm focus:border-teal-700 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800"
                />
              </div>
              {originResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white p-1 shadow-md dark:border-stone-700 dark:bg-stone-800">
                  {originResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setOrigin(
                          r.subtitle ? `${r.name}, ${r.subtitle}` : r.name
                        );
                        setOriginCoords(r.coords);
                        setOriginResults([]);
                      }}
                      className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <div className="font-medium">{r.name}</div>
                      <div className="truncate text-[11px] text-stone-400">
                        {r.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-stone-500">
                To
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-teal-700 dark:text-teal-400" />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => handleLookupDest(e.target.value)}
                  placeholder="Manali, Jaipur, Goa"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-8 pr-3 text-sm focus:border-teal-700 focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800"
                />
              </div>
              {destResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-200 bg-white p-1 shadow-md dark:border-stone-700 dark:bg-stone-800">
                  {destResults.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDestination(
                          r.subtitle ? `${r.name}, ${r.subtitle}` : r.name
                        );
                        setDestCoords(r.coords);
                        setDestResults([]);
                      }}
                      className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <div className="font-medium">{r.name}</div>
                      <div className="truncate text-[11px] text-stone-400">
                        {r.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-500">
                Start
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-500">
                End
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-500">
                Budget (₹)
              </label>
              <input
                type="number"
                min={1000}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1e3a5f] dark:text-sky-300">
                <input
                  type="checkbox"
                  checked={autoPlanWholeTrip}
                  onChange={(e) => setAutoPlanWholeTrip(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#cfd9e0] accent-[#1e3a5f]"
                />
                <span>
                  Auto-plan whole {dayCount}-day trip (places & daily schedule)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-400">Popular:</span>
                {POPULAR_ROUTES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setOrigin(preset.origin);
                      setOriginCoords(preset.originCoords);
                      setDestination(preset.destination);
                      setDestCoords(preset.destCoords);
                      setBudget(String(preset.budget));
                    }}
                    className="rounded-md border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingRoute}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#162c49] disabled:opacity-60"
            >
              {loadingRoute ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Search routes
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        </div>

        <section className="mt-10 space-y-4">
          <h2 className="text-base font-semibold text-[#18222f] dark:text-white">
            Saved & sample trips
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => openExistingTrip(trip.id)}
                className="group cursor-pointer rounded-xl border border-[#d7e0e6] bg-white p-5 transition hover:border-[#8fa8ba] hover:bg-[#fafcfc] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#18222f] group-hover:text-[#1e3a5f] dark:text-white dark:group-hover:text-sky-300">
                    {trip.name}
                  </h3>
                  <span className="rounded-md bg-[#e9f0ec] px-2 py-0.5 text-xs font-semibold text-[#244c3c] dark:bg-emerald-950/50 dark:text-emerald-300">
                    {formatMoney(trip.totalBudget, trip.currency)}
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-[#546575] dark:text-slate-400">
                  {trip.origin ? `${trip.origin} → ` : ""}
                  {trip.destination}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#ebf0f3] pt-3 text-xs text-[#546575] dark:border-slate-800">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {trip.days.length} days
                  </span>
                  <span className="font-semibold text-[#1e3a5f] dark:text-sky-300">
                    Open →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
