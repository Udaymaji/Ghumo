"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_TRIPS } from "@/data/mockTrips";
import type { Trip } from "@/types/trip";

export const STORAGE_TRIPS_KEY = "ghumo_trips_v3";
export const STORAGE_ACTIVE_KEY = "ghumo_active_trip_v3";

export function useTripsStore() {
  const searchParams = useSearchParams();
  const tripParam = searchParams.get("trip");

  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [activeTripId, setActiveTripId] = useState<string>(MOCK_TRIPS[0].id);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(STORAGE_TRIPS_KEY);
        const savedActive = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Trip[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTrips(parsed);
            if (tripParam && parsed.some((t) => t.id === tripParam)) {
              setActiveTripId(tripParam);
            } else if (savedActive && parsed.some((t) => t.id === savedActive)) {
              setActiveTripId(savedActive);
            } else {
              setActiveTripId(parsed[0].id);
            }
          }
        } else if (tripParam && MOCK_TRIPS.some((t) => t.id === tripParam)) {
          setActiveTripId(tripParam);
        }
      } catch {
        // Ignore malformed storage
      } finally {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, [tripParam]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_TRIPS_KEY, JSON.stringify(trips));
      localStorage.setItem(STORAGE_ACTIVE_KEY, activeTripId);
    } catch {
      // Ignore quota errors
    }
  }, [trips, activeTripId, hydrated]);

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === activeTripId) ?? trips[0],
    [trips, activeTripId]
  );

  const updateActiveTrip = (updater: (trip: Trip) => Trip) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === activeTrip.id ? updater(t) : t))
    );
  };

  const resetDemo = () => {
    setTrips(MOCK_TRIPS);
    setActiveTripId(MOCK_TRIPS[0].id);
    localStorage.removeItem(STORAGE_TRIPS_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_KEY);
  };

  return {
    trips,
    setTrips,
    activeTrip,
    activeTripId,
    setActiveTripId,
    updateActiveTrip,
    resetDemo,
  };
}
