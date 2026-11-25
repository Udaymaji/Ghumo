"use client";

import React, { useMemo, useState } from "react";
import {
  Bus,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  Plane,
  Plus,
  TrainFront,
} from "lucide-react";
import {
  formatDuration,
  formatMoney,
  generateTransitOptions,
} from "@/lib/tripUtils";
import type { Activity, TransitOption, Trip } from "@/types/trip";

interface TransitOptionsPanelProps {
  trip: Trip;
  onAddTransitToDay1: (activity: Omit<Activity, "id">) => void;
}

const MODE_ICONS: Record<
  TransitOption["mode"],
  React.ComponentType<{ className?: string }>
> = {
  plane: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
};

export default function TransitOptionsPanel({
  trip,
  onAddTransitToDay1,
}: TransitOptionsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("mode-train");
  const [addedId, setAddedId] = useState<string | null>(null);

  const originName = trip.origin || "New Delhi, India";

  const options = useMemo(() => {
    const originCoords = trip.originCoords || { lat: 28.6139, lng: 77.209 };
    return generateTransitOptions(
      originName,
      originCoords,
      trip.destination,
      trip.centerCoords
    );
  }, [originName, trip.originCoords, trip.destination, trip.centerCoords]);

  const handleAdd = (opt: TransitOption) => {
    setSelectedId(opt.id);
    onAddTransitToDay1({
      title: `${opt.label}: ${originName.split(",")[0]} → ${trip.destination.split(",")[0]}`,
      time: "07:00",
      durationMins: opt.durationMins,
      category: "transit",
      location: `${originName} → ${trip.destination}`,
      cost: opt.estimatedCostInr,
      notes: `${opt.carrier} • ~${opt.distanceKm} km`,
      coords: trip.centerCoords,
      votes: 1,
      votedByMe: true,
    });
    setAddedId(opt.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="rounded-xl border border-[#d7e0e6] bg-[#fafbfc] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#edf2f4]/70 px-5 py-3.5 dark:bg-slate-800/50">
        <div>
          <h2 className="text-sm font-semibold text-[#142334] dark:text-white">
            Getting there: {originName.split(",")[0]} →{" "}
            {trip.destination.split(",")[0]}
          </h2>
          <p className="text-xs text-[#546575] dark:text-slate-400">
            Compare Plane, Train, Bus & Road and add to Day 1
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#cfd9e0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e3a5f] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {expanded ? (
            <>
              Hide
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show options
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-stone-100 p-4 sm:grid-cols-2 xl:grid-cols-4 dark:border-stone-800">
          {options.map((opt) => {
            const Icon = MODE_ICONS[opt.mode];
            const isSelected = selectedId === opt.id;
            const isAdded = addedId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`flex cursor-pointer flex-col justify-between rounded-lg border p-3.5 transition ${
                  isSelected
                    ? "border-[#1e3a5f] bg-[#edf2f5]/60 dark:border-sky-500 dark:bg-slate-800/60"
                    : "border-[#dde4e9] bg-white hover:border-[#9fb3c2] dark:border-slate-800 dark:bg-slate-900"
                } ${!opt.available ? "opacity-55" : ""}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18222f] dark:text-white">
                      <Icon className="h-4 w-4 text-[#1e3a5f] dark:text-sky-300" />
                      {opt.label}
                    </span>
                    <span className="rounded bg-[#e9f0ec] px-1.5 py-0.5 text-xs font-semibold text-[#244c3c] dark:bg-emerald-950/50 dark:text-emerald-300">
                      {formatMoney(opt.estimatedCostInr, "INR")}
                    </span>
                  </div>

                  <div className="text-xs text-[#4a5b6c] dark:text-slate-300">
                    {formatDuration(opt.durationMins)} · ~{opt.distanceKm} km
                  </div>

                  <p className="text-[11px] text-[#5c6d7d] dark:text-slate-400">
                    {opt.carrier}
                  </p>
                  <p className="text-[11px] text-[#2f6b55] dark:text-emerald-400">
                    {opt.highlight}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!opt.available}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(opt);
                  }}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    isAdded
                      ? "bg-[#2f6b55] text-white"
                      : "border border-[#cfd9e0] bg-white text-[#1e3a5f] hover:bg-[#e6edf2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add to Day 1
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
