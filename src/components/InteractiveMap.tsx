"use client";

import dynamic from "next/dynamic";
import type { Trip } from "@/types/trip";

interface InteractiveMapProps {
  trip: Trip;
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string) => void;
}

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      Loading interactive map…
    </div>
  ),
});

export default function InteractiveMap(props: InteractiveMapProps) {
  return <LeafletMap {...props} />;
}
