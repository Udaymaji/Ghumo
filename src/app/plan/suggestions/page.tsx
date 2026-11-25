"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PlaceSuggestionsPanel from "@/components/PlaceSuggestionsPanel";
import PlanShell from "@/components/PlanShell";
import { useTripsStore } from "@/lib/useTripsStore";
import type { Activity } from "@/types/trip";

function SuggestionsPageContent() {
  const {
    trips,
    activeTrip,
    setActiveTripId,
    updateActiveTrip,
    resetDemo,
  } = useTripsStore();

  const handleAddToDay = (dayNumber: number, actData: Omit<Activity, "id">) => {
    const newAct: Activity = {
      ...actData,
      id: `act-${Date.now().toString(36)}`,
    };
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.dayNumber === dayNumber
          ? { ...d, activities: [...d.activities, newAct] }
          : d
      ),
    }));
  };

  return (
    <PlanShell
      trips={trips}
      activeTrip={activeTrip}
      onSelectTrip={setActiveTripId}
      onUpdateTrip={updateActiveTrip}
      onResetDemo={resetDemo}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#142334] dark:text-white">
              Place Suggestions
            </h1>
            <p className="text-xs text-[#546575] dark:text-slate-400">
              Browse curated spots or search OpenStreetMap to add to any day
            </p>
          </div>
          <Link
            href={`/plan?trip=${encodeURIComponent(activeTrip.id)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6dfe5] bg-white px-3.5 py-2 text-xs font-medium text-[#1e3a5f] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
          >
            Back to Itinerary
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#d7e0e6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <PlaceSuggestionsPanel trip={activeTrip} onAddToDay={handleAddToDay} />
        </div>
      </div>
    </PlanShell>
  );
}

export default function SuggestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#546575]">
          Loading suggestions…
        </div>
      }
    >
      <SuggestionsPageContent />
    </Suspense>
  );
}
