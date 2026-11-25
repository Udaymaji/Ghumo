"use client";

import React, { useMemo, useState } from "react";
import { Loader2, MapPin, Plus, Search } from "lucide-react";
import { CURATED_SUGGESTIONS } from "@/data/mockTrips";
import { searchPlaces, type PlaceResult } from "@/lib/geocoding";
import { formatDuration, formatMoney } from "@/lib/tripUtils";
import type { Activity, Trip, VibeCategory } from "@/types/trip";

interface PlaceSuggestionsPanelProps {
  trip: Trip;
  onAddToDay: (dayNumber: number, activity: Omit<Activity, "id">) => void;
}

const VIBES: Array<"All" | VibeCategory> = [
  "All",
  "Culture & History",
  "Food & Markets",
  "Hidden Gems",
  "Nature & Views",
];

export default function PlaceSuggestionsPanel({
  trip,
  onAddToDay,
}: PlaceSuggestionsPanelProps) {
  const [selectedVibe, setSelectedVibe] = useState<"All" | VibeCategory>("All");
  const [query, setQuery] = useState("");
  const [targetDay, setTargetDay] = useState<number>(
    trip.days[0]?.dayNumber ?? 1
  );
  const [livePlaces, setLivePlaces] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  const effectiveDay = trip.days.some((d) => d.dayNumber === targetDay)
    ? targetDay
    : trip.days[0]?.dayNumber ?? 1;

  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const destLower = trip.destination.toLowerCase();

    return CURATED_SUGGESTIONS.filter((s) => {
      if (selectedVibe !== "All" && s.vibe !== selectedVibe) return false;
      if (q) {
        return (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.destinationTag.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
        );
      }
      if (
        destLower.includes("jaipur") ||
        destLower.includes("udaipur") ||
        destLower.includes("rajasthan")
      ) {
        return s.destinationTag === "Jaipur" || s.destinationTag === "Udaipur";
      }
      if (destLower.includes("goa") || destLower.includes("hampi")) {
        return s.destinationTag === "Goa" || s.destinationTag === "Hampi";
      }
      return true;
    });
  }, [selectedVibe, query, trip.destination]);

  const handleLiveDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await searchPlaces(
        `${query.trim()} ${trip.destination}`,
        trip.centerCoords
      );
      setLivePlaces(results);
    } catch {
      setLivePlaces([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {VIBES.map((vibe) => (
          <button
            key={vibe}
            type="button"
            onClick={() => setSelectedVibe(vibe)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedVibe === vibe
                ? "bg-[#1e3a5f] text-white"
                : "bg-[#edf2f4] text-[#4a5b6c] hover:bg-[#e1e9ee] dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {vibe}
          </button>
        ))}
      </div>

      <form onSubmit={handleLiveDiscover} className="flex flex-wrap gap-2">
        <div className="relative min-w-[170px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafes, forts, viewpoints..."
            className="w-full rounded-md border border-[#d6dfe5] bg-white py-1.5 pl-8 pr-2 text-xs text-[#18222f] placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={effectiveDay}
          onChange={(e) => setTargetDay(Number(e.target.value))}
          aria-label="Target day"
          className="rounded-md border border-[#d6dfe5] bg-white px-2 py-1.5 text-xs font-medium text-[#18222f] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {trip.days.map((d) => (
            <option key={d.id} value={d.dayNumber}>
              Day {d.dayNumber}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#162c49] disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Find
        </button>
      </form>

      {livePlaces.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-[#d6dfe5] bg-[#f7f9fa] p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-[11px] font-medium text-[#4a5b6c] dark:text-slate-300">
            <span>Places near {trip.destination}</span>
            <button
              type="button"
              onClick={() => setLivePlaces([])}
              className="text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          </div>
          {livePlaces.map((place, idx) => (
            <div
              key={`${place.name}-${idx}`}
              className="flex items-center justify-between gap-2 rounded-md bg-white p-2 text-xs dark:bg-slate-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[#18222f] dark:text-white">
                  {place.name}
                </p>
                <p className="truncate text-[11px] text-[#5c6d7d]">
                  {place.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddToDay(effectiveDay, {
                    title: place.name,
                    time: "14:00",
                    durationMins: 90,
                    category: "sightseeing",
                    location: place.subtitle || place.name,
                    cost: 0,
                    coords: place.coords,
                    votes: 1,
                    votedByMe: true,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded bg-[#1e3a5f] px-2 py-1 text-xs font-medium text-white hover:bg-[#162c49]"
              >
                <Plus className="h-3 w-3" />
                Day {effectiveDay}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filteredSuggestions.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#5c6d7d]">
            No preset matches. Click <strong>Find</strong> above to search
            places on OpenStreetMap.
          </p>
        ) : (
          filteredSuggestions.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-[#dde4e9] bg-white p-3 transition hover:border-[#9fb3c2] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5c6d7d]">
                  <span className="font-medium text-[#244c3c] dark:text-emerald-300">
                    {item.vibe}
                  </span>
                  <span>·</span>
                  <span>{formatDuration(item.durationMins)}</span>
                  {item.estimatedCost > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        ~{formatMoney(item.estimatedCost, trip.currency)}
                      </span>
                    </>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-[#18222f] dark:text-white">
                  {item.title}
                </h4>
                <p className="text-[11px] leading-relaxed text-[#546575] dark:text-slate-400">
                  {item.description}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] text-[#6e7e8d]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {item.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onAddToDay(effectiveDay, {
                    title: item.title,
                    time: "15:00",
                    durationMins: item.durationMins,
                    category: item.category,
                    location: item.location,
                    cost: item.estimatedCost,
                    notes: item.description,
                    coords: item.coords,
                    votes: 1,
                    votedByMe: true,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#cfd9e0] bg-white px-2.5 py-1 text-xs font-medium text-[#1e3a5f] hover:bg-[#e6edf2] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
