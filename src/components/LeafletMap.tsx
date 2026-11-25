"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  Bike,
  Car,
  Crosshair,
  Footprints,
  Loader2,
  Navigation,
  Route,
} from "lucide-react";
import { fetchOSRMRoute } from "@/lib/geocoding";
import {
  estimateDistanceKm,
  formatDistanceKm,
  formatDuration,
  getDayColor,
  getGoogleMapsDirectionsUrl,
} from "@/lib/tripUtils";
import type { GeoCoords, TravelMode, Trip } from "@/types/trip";

interface RealLeafletMapProps {
  trip: Trip;
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string) => void;
}

interface RouteStats {
  distanceMeters: number;
  durationSeconds: number;
}

const MODE_OPTIONS: Array<{
  id: TravelMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "walking", label: "Walk", Icon: Footprints },
  { id: "driving", label: "Drive", Icon: Car },
  { id: "cycling", label: "Bike", Icon: Bike },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function RealLeafletMap({
  trip,
  selectedActivityId,
  onSelectActivity,
}: RealLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const watchIdRef = useRef<number | null>(null);

  const [dayFilter, setDayFilter] = useState<number | "all">("all");
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<GeoCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const effectiveDayFilter = useMemo(() => {
    if (
      dayFilter !== "all" &&
      !trip.days.some((d) => d.dayNumber === dayFilter)
    ) {
      return "all";
    }
    return dayFilter;
  }, [trip.days, dayFilter]);

  const visibleDays = useMemo(() => {
    if (effectiveDayFilter === "all") return trip.days;
    return trip.days.filter((d) => d.dayNumber === effectiveDayFilter);
  }, [trip.days, effectiveDayFilter]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const markerMap = markerByIdRef.current;
    const map = L.map(containerRef.current, {
      center: [trip.centerCoords.lat, trip.centerCoords.lng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    routesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    gpsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      routesLayerRef.current = null;
      gpsLayerRef.current = null;
      markerMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerByIdRef.current.clear();

    const boundsPoints: [number, number][] = [];

    for (const day of visibleDays) {
      const color = getDayColor(day.dayNumber);
      day.activities.forEach((act, idx) => {
        const latLng: [number, number] = [act.coords.lat, act.coords.lng];
        boundsPoints.push(latLng);

        const isSelected = selectedActivityId === act.id;
        const icon = L.divIcon({
          className: "ghumo-pin-wrapper",
          html: `<div style="
            width:${isSelected ? 30 : 24}px;
            height:${isSelected ? 30 : 24}px;
            border-radius:9999px;
            background:${color};
            color:#fff;
            font-weight:700;
            font-size:11px;
            display:flex;
            align-items:center;
            justify-content:center;
            border:${isSelected ? "3px solid #1c1917" : "2px solid #ffffff"};
            box-shadow:0 2px 6px rgba(0,0,0,0.28);
          ">${idx + 1}</div>`,
          iconSize: [isSelected ? 30 : 24, isSelected ? 30 : 24],
          iconAnchor: [isSelected ? 15 : 12, isSelected ? 15 : 12],
          popupAnchor: [0, -14],
        });

        const mapsUrl = getGoogleMapsDirectionsUrl(
          act.coords,
          travelMode,
          gpsCoords ?? undefined
        );

        const popupHtml = `
          <div style="min-width:185px;font-family:inherit;line-height:1.4;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="background:${color};color:#fff;font-size:10px;font-weight:600;padding:1px 6px;border-radius:4px;">Day ${day.dayNumber} · #${idx + 1}</span>
              <span style="font-size:11px;color:#78716c;">${escapeHtml(act.time)}</span>
            </div>
            <div style="font-weight:600;font-size:13px;color:#1c1917;margin-bottom:2px;">${escapeHtml(act.title)}</div>
            <div style="font-size:11px;color:#57534e;margin-bottom:8px;">${escapeHtml(act.location)}</div>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
              style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#0f766e;text-decoration:none;">
              Directions in Maps ↗
            </a>
          </div>
        `;

        const marker = L.marker(latLng, { icon }).bindPopup(popupHtml);
        marker.on("click", () => {
          onSelectActivity?.(act.id);
        });
        marker.addTo(markersLayer);
        markerByIdRef.current.set(act.id, marker);
      });
    }

    if (boundsPoints.length > 0) {
      map.fitBounds(boundsPoints, { padding: [36, 36], maxZoom: 14 });
    } else {
      map.setView([trip.centerCoords.lat, trip.centerCoords.lng], 12);
    }
  }, [
    visibleDays,
    trip.centerCoords,
    selectedActivityId,
    travelMode,
    gpsCoords,
    onSelectActivity,
  ]);

  useEffect(() => {
    if (!selectedActivityId) return;
    const marker = markerByIdRef.current.get(selectedActivityId);
    if (marker && mapRef.current) {
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
      marker.openPopup();
    }
  }, [selectedActivityId]);

  useEffect(() => {
    const routesLayer = routesLayerRef.current;
    if (!routesLayer) return;

    let cancelled = false;
    routesLayer.clearLayers();

    const daysWithRoutes = visibleDays.filter((d) => d.activities.length >= 2);

    (async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (daysWithRoutes.length === 0) {
        setRouteStats(null);
        setRouteLoading(false);
        return;
      }

      setRouteLoading(true);
      let totalDist = 0;
      let totalDur = 0;

      await Promise.all(
        daysWithRoutes.map(async (day) => {
          const waypoints = day.activities.map((a) => a.coords);
          const color = getDayColor(day.dayNumber);

          try {
            const result = await fetchOSRMRoute(waypoints, travelMode);
            if (cancelled) return;

            if (result && result.coordinates.length >= 2) {
              totalDist += result.distanceMeters;
              totalDur += result.durationSeconds;
              L.polyline(result.coordinates, {
                color,
                weight: 4,
                opacity: 0.85,
              }).addTo(routesLayer);
              return;
            }
          } catch {
            // Fallback to straight-line segments below
          }

          if (cancelled) return;
          const fallbackCoords: [number, number][] = waypoints.map((w) => [
            w.lat,
            w.lng,
          ]);
          for (let i = 0; i < waypoints.length - 1; i++) {
            totalDist += estimateDistanceKm(waypoints[i], waypoints[i + 1]) * 1000;
          }
          L.polyline(fallbackCoords, {
            color,
            weight: 3,
            opacity: 0.6,
            dashArray: "6 6",
          }).addTo(routesLayer);
        })
      );

      if (!cancelled) {
        setRouteStats({ distanceMeters: totalDist, durationSeconds: totalDur });
        setRouteLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleDays, travelMode]);

  const toggleGps = () => {
    if (gpsEnabled) {
      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      gpsLayerRef.current?.clearLayers();
      setGpsEnabled(false);
      setGpsCoords(null);
      setGpsError(null);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Geolocation is not supported in this browser.");
      return;
    }

    setGpsError(null);
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsCoords(coords);

        const gpsLayer = gpsLayerRef.current;
        if (gpsLayer) {
          gpsLayer.clearLayers();
          L.circleMarker([coords.lat, coords.lng], {
            radius: 8,
            color: "#ffffff",
            weight: 3,
            fillColor: "#0f766e",
            fillOpacity: 1,
          })
            .bindPopup("<strong>You are here</strong>")
            .addTo(gpsLayer);
        }

        mapRef.current?.panTo([coords.lat, coords.lng], { animate: true });
      },
      (err) => {
        setGpsError(err.message || "Unable to access GPS location.");
        setGpsEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ebf0f3] px-3 py-2 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDayFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              effectiveDayFilter === "all"
                ? "bg-[#1e3a5f] text-white"
                : "bg-[#edf2f4] text-[#4a5b6c] hover:bg-[#e1e9ee] dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            All Days
          </button>
          {trip.days.map((day) => {
            const active = effectiveDayFilter === day.dayNumber;
            const color = getDayColor(day.dayNumber);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setDayFilter(day.dayNumber)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
                }`}
                style={active ? { backgroundColor: color } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: active ? "#ffffff" : color }}
                />
                Day {day.dayNumber}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex rounded-md bg-stone-100 p-0.5 dark:bg-stone-800">
            {MODE_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTravelMode(id)}
                title={`${label} route`}
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                  travelMode === id
                    ? "bg-white text-teal-700 shadow-xs dark:bg-stone-700 dark:text-teal-300"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleGps}
            title="Toggle live GPS position"
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              gpsEnabled
                ? "border-[#2f6b55] bg-[#2f6b55] text-white"
                : "border-[#d6dfe5] bg-white text-[#3b4d5e] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{gpsEnabled ? "GPS On" : "GPS"}</span>
          </button>
        </div>
      </div>

      <div className="relative h-[340px] w-full sm:h-[360px]">
        <div ref={containerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute bottom-3 left-3 z-[2] flex flex-wrap items-center gap-2">
          {routeLoading ? (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm dark:bg-stone-900/95 dark:text-stone-200">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" />
              Calculating route…
            </div>
          ) : routeStats && routeStats.distanceMeters > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm dark:bg-stone-900/95 dark:text-stone-200">
              <Route className="h-3.5 w-3.5 text-teal-700" />
              <span>{formatDistanceKm(routeStats.distanceMeters)}</span>
              {routeStats.durationSeconds > 0 && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">·</span>
                  <span>
                    {formatDuration(routeStats.durationSeconds / 60)} {travelMode}
                  </span>
                </>
              )}
            </div>
          ) : null}

          {gpsCoords && (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
              <Navigation className="h-3 w-3" />
              GPS active
            </div>
          )}
        </div>
      </div>

      {gpsError && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {gpsError}
        </div>
      )}
    </div>
  );
}
