"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
  Wand2,
} from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";
import PlanShell from "@/components/PlanShell";
import { autoPlanTripDays } from "@/lib/autoPlanner";
import { searchPlaces, type PlaceResult } from "@/lib/geocoding";
import {
  CATEGORY_LABELS,
  estimateDistanceKm,
  formatDuration,
  formatMoney,
  getDayColor,
  getDayCount,
} from "@/lib/tripUtils";
import { useTripsStore } from "@/lib/useTripsStore";
import type { Activity, ActivityCategory, GeoCoords } from "@/types/trip";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export default function PlanItineraryView() {
  const {
    trips,
    activeTrip,
    setActiveTripId,
    updateActiveTrip,
    resetDemo,
  } = useTripsStore();

  const [mapOpen, setMapOpen] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [autoPlanning, setAutoPlanning] = useState(false);

  const [addingDayNumber, setAddingDayNumber] = useState<number | null>(null);
  const [stopTitle, setStopTitle] = useState("");
  const [stopTime, setStopTime] = useState("10:00");
  const [stopDuration, setStopDuration] = useState("90");
  const [stopCategory, setStopCategory] =
    useState<ActivityCategory>("sightseeing");
  const [stopCost, setStopCost] = useState("0");
  const [stopLocation, setStopLocation] = useState("");
  const [stopCoords, setStopCoords] = useState<GeoCoords | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searchingPlace, setSearchingPlace] = useState(false);

  const handleAutoPlanWholeTrip = async () => {
    setAutoPlanning(true);
    try {
      const count = getDayCount(activeTrip.startDate, activeTrip.endDate);
      const generatedDays = await autoPlanTripDays(
        activeTrip.destination,
        activeTrip.centerCoords,
        activeTrip.startDate,
        count
      );
      updateActiveTrip((t) => ({ ...t, days: generatedDays }));
      setSelectedActivityId(generatedDays[0]?.activities[0]?.id ?? null);
    } finally {
      setAutoPlanning(false);
    }
  };

  const handleAddDay = () => {
    updateActiveTrip((trip) => {
      const nextNum = trip.days.length + 1;
      const lastDate = trip.days[trip.days.length - 1]?.date || trip.startDate;
      const nextDateObj = new Date(lastDate);
      if (!Number.isNaN(nextDateObj.getTime())) {
        nextDateObj.setDate(nextDateObj.getDate() + 1);
      }
      const nextDate = Number.isNaN(nextDateObj.getTime())
        ? trip.endDate
        : nextDateObj.toISOString().slice(0, 10);

      return {
        ...trip,
        days: [
          ...trip.days,
          {
            id: uid("day"),
            dayNumber: nextNum,
            date: nextDate,
            title: `Day ${nextNum}`,
            activities: [],
          },
        ],
      };
    });
  };

  const handleSearchStopPlace = async () => {
    const q = placeQuery.trim() || stopTitle.trim();
    if (!q) return;
    setSearchingPlace(true);
    try {
      const results = await searchPlaces(q, activeTrip.centerCoords);
      setPlaceResults(results);
    } catch {
      setPlaceResults([]);
    } finally {
      setSearchingPlace(false);
    }
  };

  const handlePickPlace = (place: PlaceResult) => {
    if (!stopTitle.trim()) setStopTitle(place.name);
    setStopLocation(
      place.subtitle ? `${place.name}, ${place.subtitle}` : place.name
    );
    setStopCoords(place.coords);
    setPlaceResults([]);
  };

  const handleAddStopSubmit = (e: React.FormEvent, dayNumber: number) => {
    e.preventDefault();
    if (!stopTitle.trim()) return;

    const newAct: Activity = {
      id: uid("act"),
      title: stopTitle.trim(),
      time: stopTime || "10:00",
      durationMins: Math.max(15, Number(stopDuration) || 60),
      category: stopCategory,
      location: stopLocation.trim() || activeTrip.destination,
      cost: Math.max(0, Number(stopCost) || 0),
      coords: stopCoords ?? activeTrip.centerCoords,
      votes: 1,
      votedByMe: true,
    };

    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.dayNumber === dayNumber
          ? { ...d, activities: [...d.activities, newAct] }
          : d
      ),
    }));

    setSelectedActivityId(newAct.id);
    setAddingDayNumber(null);
    setStopTitle("");
    setStopLocation("");
    setStopCoords(null);
    setPlaceQuery("");
    setPlaceResults([]);
    setStopCost("0");
  };

  const handleMoveStop = (
    dayNumber: number,
    index: number,
    direction: -1 | 1
  ) => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) => {
        if (d.dayNumber !== dayNumber) return d;
        const targetIdx = index + direction;
        if (targetIdx < 0 || targetIdx >= d.activities.length) return d;
        const copy = [...d.activities];
        const [item] = copy.splice(index, 1);
        copy.splice(targetIdx, 0, item);
        return { ...d, activities: copy };
      }),
    }));
  };

  const handleDeleteStop = (dayNumber: number, activityId: string) => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.dayNumber === dayNumber
          ? {
              ...d,
              activities: d.activities.filter((a) => a.id !== activityId),
            }
          : d
      ),
    }));
  };

  const handleToggleVote = (dayNumber: number, activityId: string) => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.dayNumber === dayNumber
          ? {
              ...d,
              activities: d.activities.map((a) => {
                if (a.id !== activityId) return a;
                const voted = !a.votedByMe;
                return {
                  ...a,
                  votedByMe: voted,
                  votes: Math.max(0, a.votes + (voted ? 1 : -1)),
                };
              }),
            }
          : d
      ),
    }));
  };

  return (
    <PlanShell
      trips={trips}
      activeTrip={activeTrip}
      onSelectTrip={(id) => {
        setActiveTripId(id);
        setSelectedActivityId(null);
      }}
      onUpdateTrip={updateActiveTrip}
      onResetDemo={resetDemo}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className={`space-y-4 ${mapOpen ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <div className="rounded-xl border border-[#d7e0e6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#142334] sm:text-2xl dark:text-white">
                  {activeTrip.name}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#546575] dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {activeTrip.destination}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {activeTrip.startDate} → {activeTrip.endDate} ({activeTrip.days.length} days)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoPlanWholeTrip}
                  disabled={autoPlanning}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162c49] disabled:opacity-60"
                >
                  {autoPlanning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  Auto-plan whole trip
                </button>
                <button
                  type="button"
                  onClick={handleAddDay}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6dfe5] bg-[#f7f9fa] px-3 py-1.5 text-xs font-medium text-[#3b4d5e] hover:bg-[#e9eff3] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add day
                </button>
                {!mapOpen && (
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#8fb0a3] bg-[#e9f0ec] px-3 py-1.5 text-xs font-medium text-[#244c3c]"
                  >
                    <MapIcon className="h-3.5 w-3.5" />
                    Open map
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeTrip.days.map((day) => {
            const dayColor = getDayColor(day.dayNumber);
            const isAdding = addingDayNumber === day.dayNumber;

            return (
              <div
                key={day.id}
                className="overflow-hidden rounded-xl border border-[#d7e0e6] bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebf0f3] px-5 py-3.5 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: dayColor }}
                    >
                      Day {day.dayNumber}
                    </span>
                    <h2 className="text-sm font-semibold text-[#18222f] dark:text-white">
                      {day.title}
                    </h2>
                    <span className="text-xs text-[#6e7e8d]">{day.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingDayNumber(isAdding ? null : day.dayNumber);
                      setPlaceResults([]);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#d6dfe5] px-2.5 py-1 text-xs font-medium text-[#3b4d5e] hover:bg-[#f3f6f8] dark:border-slate-700 dark:text-slate-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add stop
                  </button>
                </div>

                {isAdding && (
                  <form
                    onSubmit={(e) => handleAddStopSubmit(e, day.dayNumber)}
                    className="space-y-3 border-b border-[#ebf0f3] bg-[#f7f9fa] p-4 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                        placeholder={`Search place near ${activeTrip.destination}...`}
                        className="flex-1 rounded-md border border-[#d6dfe5] bg-white px-3 py-1.5 text-xs text-[#18222f] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSearchStopPlace}
                        disabled={searchingPlace}
                        className="inline-flex items-center gap-1 rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162c49]"
                      >
                        {searchingPlace ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        Find
                      </button>
                    </div>

                    {placeResults.length > 0 && (
                      <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-[#d6dfe5] bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
                        {placeResults.map((pr, idx) => (
                          <button
                            key={`${pr.name}-${idx}`}
                            type="button"
                            onClick={() => handlePickPlace(pr)}
                            className="flex w-full items-start justify-between rounded px-2.5 py-1.5 text-left text-xs hover:bg-[#edf2f5] dark:hover:bg-slate-800"
                          >
                            <div>
                              <p className="font-medium text-[#18222f] dark:text-white">
                                {pr.name}
                              </p>
                              <p className="text-[11px] text-[#5c6d7d]">
                                {pr.subtitle}
                              </p>
                            </div>
                            <span className="text-[10px] font-medium text-[#1e3a5f] dark:text-sky-300">
                              Pin
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input
                        type="text"
                        required
                        placeholder="Stop title *"
                        value={stopTitle}
                        onChange={(e) => setStopTitle(e.target.value)}
                        className="col-span-2 rounded-md border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        type="time"
                        value={stopTime}
                        onChange={(e) => setStopTime(e.target.value)}
                        className="rounded-md border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <select
                        value={stopCategory}
                        onChange={(e) =>
                          setStopCategory(e.target.value as ActivityCategory)
                        }
                        className="rounded-md border border-[#d6dfe5] bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map(
                          (cat) => (
                            <option key={cat} value={cat}>
                              {CATEGORY_LABELS[cat]}
                            </option>
                          )
                        )}
                      </select>
                      <input
                        type="text"
                        placeholder="Address / location"
                        value={stopLocation}
                        onChange={(e) => setStopLocation(e.target.value)}
                        className="col-span-2 rounded-md border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min={15}
                        placeholder="Mins"
                        value={stopDuration}
                        onChange={(e) => setStopDuration(e.target.value)}
                        className="rounded-md border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder={`Cost (${activeTrip.currency})`}
                        value={stopCost}
                        onChange={(e) => setStopCost(e.target.value)}
                        className="rounded-md border border-[#d6dfe5] bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#5c6d7d]">
                        {stopCoords
                          ? `Pinned: ${stopCoords.lat.toFixed(4)}, ${stopCoords.lng.toFixed(4)}`
                          : "Use Find above to pin coordinates"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingDayNumber(null)}
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-[#546575] hover:bg-slate-200 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162c49]"
                        >
                          Save stop
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="divide-y divide-[#ebf0f3] dark:divide-slate-800">
                  {day.activities.length === 0 ? (
                    <div className="px-5 py-6 text-center text-xs text-[#6e7e8d]">
                      No stops yet. Click <strong>Add stop</strong> or{" "}
                      <strong>Auto-plan whole trip</strong> above.
                    </div>
                  ) : (
                    day.activities.map((act, idx) => {
                      const prev = idx > 0 ? day.activities[idx - 1] : null;
                      const distKm = prev
                        ? estimateDistanceKm(prev.coords, act.coords)
                        : null;
                      const isSelected = selectedActivityId === act.id;

                      return (
                        <div key={act.id}>
                          {distKm !== null && (
                            <div className="flex items-center gap-2 bg-[#f7f9fa] px-5 py-1 text-[11px] text-[#6e7e8d] dark:bg-slate-800/30">
                              <span className="h-3 w-px bg-[#cfd9e0] dark:bg-slate-700" />
                              <span>~{distKm.toFixed(1)} km from previous</span>
                            </div>
                          )}
                          <div
                            onClick={() => setSelectedActivityId(act.id)}
                            className={`flex cursor-pointer items-start justify-between gap-3 px-5 py-3.5 transition ${
                              isSelected
                                ? "bg-[#edf2f5] dark:bg-slate-800/60"
                                : "hover:bg-[#f7f9fa] dark:hover:bg-slate-800/30"
                            }`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span
                                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: dayColor }}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-medium text-[#1e3a5f] dark:text-sky-300">
                                    {act.time}
                                  </span>
                                  <h3 className="text-sm font-semibold text-[#18222f] dark:text-white">
                                    {act.title}
                                  </h3>
                                  <span className="rounded bg-[#edf2f4] px-1.5 py-0.5 text-[10px] font-medium text-[#4a5b6c] dark:bg-slate-800 dark:text-slate-300">
                                    {CATEGORY_LABELS[act.category]}
                                  </span>
                                </div>
                                <p className="flex items-center gap-1 truncate text-xs text-[#546575] dark:text-slate-400">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {act.location}
                                </p>
                                {act.notes && (
                                  <p className="text-xs text-[#4a5b6c] dark:text-slate-400">
                                    {act.notes}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-[11px] text-[#6e7e8d]">
                                  <span>{formatDuration(act.durationMins)}</span>
                                  {act.cost > 0 && (
                                    <span className="font-medium text-[#244c3c] dark:text-emerald-300">
                                      {formatMoney(act.cost, activeTrip.currency)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div
                              className="flex shrink-0 items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleVote(day.dayNumber, act.id)
                                }
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                                  act.votedByMe
                                    ? "bg-[#e9f0ec] text-[#244c3c] dark:bg-emerald-950 dark:text-emerald-300"
                                    : "text-[#6e7e8d] hover:bg-[#edf2f5] hover:text-[#18222f] dark:hover:bg-slate-800"
                                }`}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {act.votes}
                              </button>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() =>
                                  handleMoveStop(day.dayNumber, idx, -1)
                                }
                                title="Move up"
                                className="rounded p-1 text-[#6e7e8d] hover:bg-[#edf2f5] disabled:opacity-30 dark:hover:bg-slate-800"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === day.activities.length - 1}
                                onClick={() =>
                                  handleMoveStop(day.dayNumber, idx, 1)
                                }
                                title="Move down"
                                className="rounded p-1 text-[#6e7e8d] hover:bg-[#edf2f5] disabled:opacity-30 dark:hover:bg-slate-800"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteStop(day.dayNumber, act.id)
                                }
                                title="Delete stop"
                                className="rounded p-1 text-[#6e7e8d] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {mapOpen && (
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-xl border border-[#d7e0e6] bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-[#ebf0f3] px-4 py-2.5 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-[#1e3a5f] dark:text-sky-300" />
                    <span className="text-xs font-semibold text-[#18222f] dark:text-slate-100">
                      Route map
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapOpen(false)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#d6dfe5] px-2.5 py-1 text-[11px] font-medium text-[#3b4d5e] hover:bg-[#f3f6f8] dark:border-slate-700 dark:text-slate-200"
                  >
                    Close
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </div>

                <InteractiveMap
                  trip={activeTrip}
                  selectedActivityId={selectedActivityId}
                  onSelectActivity={setSelectedActivityId}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {!mapOpen && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#d7e0e6] bg-white px-4 py-3 text-xs text-[#546575] dark:border-slate-800 dark:bg-slate-900">
          <span>Map is closed</span>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="inline-flex items-center gap-1 font-semibold text-[#1e3a5f] hover:underline dark:text-sky-300"
          >
            Open map
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </PlanShell>
  );
}
