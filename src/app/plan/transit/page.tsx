"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PlanShell from "@/components/PlanShell";
import TransitOptionsPanel from "@/components/TransitOptionsPanel";
import { useTripsStore } from "@/lib/useTripsStore";
import type { Activity } from "@/types/trip";

function TransitPageContent() {
  const {
    trips,
    activeTrip,
    setActiveTripId,
    updateActiveTrip,
    resetDemo,
  } = useTripsStore();

  const handleAddTransitToDay1 = (actData: Omit<Activity, "id">) => {
    const newAct: Activity = {
      ...actData,
      id: `act-${Date.now().toString(36)}`,
    };
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.dayNumber === 1
          ? { ...d, activities: [newAct, ...d.activities] }
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
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#142334] dark:text-white">
              Travel Options
            </h1>
            <p className="text-xs text-[#546575] dark:text-slate-400">
              Choose how to reach {activeTrip.destination} from{" "}
              {activeTrip.origin || "New Delhi, India"}
            </p>
          </div>
          <Link
            href={`/plan?trip=${encodeURIComponent(activeTrip.id)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-medium text-white hover:bg-[#162c49]"
          >
            Continue to Itinerary & Map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <TransitOptionsPanel
          trip={activeTrip}
          onAddTransitToDay1={handleAddTransitToDay1}
        />
      </div>
    </PlanShell>
  );
}

export default function TransitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#546575]">
          Loading travel options…
        </div>
      }
    >
      <TransitPageContent />
    </Suspense>
  );
}
