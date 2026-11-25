import { Suspense } from "react";
import PlanItineraryView from "@/components/PlanItineraryView";

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#546575] dark:bg-[#0f1419] dark:text-slate-400">
          Loading GHUMO itinerary…
        </div>
      }
    >
      <PlanItineraryView />
    </Suspense>
  );
}
