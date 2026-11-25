import { searchPlaces, type PlaceResult } from "@/lib/geocoding";
import { addDaysIso } from "@/lib/tripUtils";
import type { Activity, ActivityCategory, GeoCoords, TripDay } from "@/types/trip";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

const SLOT_TEMPLATES: Array<{
  time: string;
  durationMins: number;
  category: ActivityCategory;
  cost: number;
  labelPrefix: string;
}> = [
  {
    time: "09:30",
    durationMins: 120,
    category: "sightseeing",
    cost: 400,
    labelPrefix: "Explore",
  },
  {
    time: "13:00",
    durationMins: 75,
    category: "food",
    cost: 900,
    labelPrefix: "Lunch near",
  },
  {
    time: "16:30",
    durationMins: 90,
    category: "activity",
    cost: 300,
    labelPrefix: "Evening at",
  },
];

const DAY_THEMES = [
  "Landmarks & Old Quarter",
  "Local Markets & Flavors",
  "Scenic Views & Parks",
  "Hidden Corners & Cafes",
  "Heritage & Sunset Walk",
  "Leisure & Neighbourhoods",
];

export async function autoPlanTripDays(
  destination: string,
  centerCoords: GeoCoords,
  startDate: string,
  dayCount: number
): Promise<TripDay[]> {
  const destShort = destination.split(",")[0].trim() || destination;
  const count = Math.max(1, Math.min(14, dayCount));
  const neededPlaces = count * 3;

  let pool: PlaceResult[] = [];
  try {
    const [sights, food, parks] = await Promise.all([
      searchPlaces(`${destShort} fort temple museum palace`, centerCoords),
      searchPlaces(`${destShort} market cafe restaurant`, centerCoords),
      searchPlaces(`${destShort} lake park viewpoint garden`, centerCoords),
    ]);
    const seen = new Set<string>();
    for (const item of [...sights, ...food, ...parks]) {
      const key = item.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(item);
      }
    }
  } catch {
    pool = [];
  }

  const days: TripDay[] = [];
  let poolIdx = 0;

  for (let d = 0; d < count; d++) {
    const dayNumber = d + 1;
    const activities: Activity[] = [];

    for (let s = 0; s < SLOT_TEMPLATES.length; s++) {
      const slot = SLOT_TEMPLATES[s];
      const place = pool[poolIdx % Math.max(1, pool.length)];
      poolIdx++;

      const offsetLat = ((d + 1) * 0.008 * (s % 2 === 0 ? 1 : -1));
      const offsetLng = ((s + 1) * 0.008 * (d % 2 === 0 ? 1 : -1));

      const title =
        place && poolIdx <= pool.length
          ? place.name
          : `${slot.labelPrefix} ${destShort} Spot ${dayNumber}.${s + 1}`;

      const location = place
        ? place.subtitle || `${place.name}, ${destShort}`
        : `${destShort} Center`;

      const coords = place
        ? place.coords
        : {
            lat: centerCoords.lat + offsetLat,
            lng: centerCoords.lng + offsetLng,
          };

      activities.push({
        id: uid("act"),
        title,
        time: slot.time,
        durationMins: slot.durationMins,
        category: slot.category,
        location,
        cost: slot.cost,
        coords,
        votes: 1,
        votedByMe: true,
      });
    }

    days.push({
      id: uid("day"),
      dayNumber,
      date: addDaysIso(startDate, d),
      title: DAY_THEMES[d % DAY_THEMES.length],
      activities,
    });
  }

  if (pool.length === 0 && neededPlaces > 0) {
    return days;
  }
  return days;
}
