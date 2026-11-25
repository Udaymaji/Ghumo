import type {
  ActivityCategory,
  CurrencyCode,
  GeoCoords,
  TransitOption,
  TravelMode,
  Trip,
} from "@/types/trip";

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { locale: string; symbol: string; decimals: number }
> = {
  USD: { locale: "en-US", symbol: "$", decimals: 0 },
  EUR: { locale: "en-IE", symbol: "€", decimals: 0 },
  JPY: { locale: "ja-JP", symbol: "¥", decimals: 0 },
  GBP: { locale: "en-GB", symbol: "£", decimals: 0 },
  INR: { locale: "en-IN", symbol: "₹", decimals: 0 },
};

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: cfg.decimals,
    }).format(amount);
  } catch {
    return `${cfg.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export function formatDuration(mins: number): string {
  const total = Math.max(0, Math.round(mins));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function estimateDistanceKm(a: GeoCoords, b: GeoCoords): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getGoogleMapsDirectionsUrl(
  destination: GeoCoords,
  mode: TravelMode = "walking",
  origin?: GeoCoords
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: mode === "cycling" ? "bicycling" : mode,
  });
  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export const DAY_COLORS = [
  "#0f766e",
  "#b45309",
  "#334155",
  "#be123c",
  "#0369a1",
  "#4338ca",
  "#4d7c0f",
];

export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(Math.max(1, dayNumber) - 1) % DAY_COLORS.length];
}

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  sightseeing: "Sightseeing",
  food: "Food & Drink",
  transit: "Transit",
  stay: "Stay",
  activity: "Activity",
};

export function exportTripToMarkdown(trip: Trip): string {
  const lines: string[] = [
    `# ${trip.name}`,
    `**Destination:** ${trip.destination}`,
    `**Dates:** ${trip.startDate} to ${trip.endDate}`,
    `**Budget:** ${formatMoney(trip.totalBudget, trip.currency)}`,
    "",
  ];

  for (const day of trip.days) {
    lines.push(`## Day ${day.dayNumber}: ${day.title} (${day.date})`);
    if (day.activities.length === 0) {
      lines.push("_No stops planned yet._", "");
      continue;
    }
    for (const act of day.activities) {
      const costStr =
        act.cost > 0 ? ` — ${formatMoney(act.cost, trip.currency)}` : "";
      lines.push(
        `- **${act.time}** · ${act.title} (${formatDuration(act.durationMins)})${costStr}`
      );
      lines.push(`  - ${act.location}`);
      if (act.notes) {
        lines.push(`  - ${act.notes}`);
      }
    }
    lines.push("");
  }

  if (trip.expenses.length > 0) {
    lines.push("## Extra Bookings & Expenses");
    for (const exp of trip.expenses) {
      lines.push(
        `- ${exp.title} (${CATEGORY_LABELS[exp.category]}): ${formatMoney(exp.amount, trip.currency)} — paid by ${exp.paidBy}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function generateTransitOptions(
  originName: string,
  originCoords: GeoCoords,
  destName: string,
  destCoords: GeoCoords
): TransitOption[] {
  const straightKm = Math.max(15, Math.round(estimateDistanceKm(originCoords, destCoords)));
  const roadKm = Math.round(straightKm * 1.18);

  const flightAvailable = straightKm >= 180;
  const flightMins = Math.round((straightKm / 720) * 60 + 95);
  const flightCost = Math.round((2800 + straightKm * 3.4) / 100) * 100;

  const trainMins = Math.round((roadKm / 72) * 60 + 20);
  const trainCost = Math.round((350 + roadKm * 1.55) / 50) * 50;

  const busMins = Math.round((roadKm / 52) * 60 + 25);
  const busCost = Math.round((250 + roadKm * 1.2) / 50) * 50;

  const carMins = Math.round((roadKm / 60) * 60);
  const carCost = Math.round((roadKm * 13) / 100) * 100;

  return [
    {
      id: "mode-plane",
      mode: "plane",
      label: "Flight",
      carrier: "IndiGo / Air India / Akasa",
      durationMins: flightMins,
      estimatedCostInr: flightCost,
      distanceKm: straightKm,
      highlight: flightAvailable
        ? "Fastest option"
        : "Short distance — train or road better",
      available: flightAvailable,
    },
    {
      id: "mode-train",
      mode: "train",
      label: "Train",
      carrier: "Vande Bharat / Shatabdi / Express",
      durationMins: trainMins,
      estimatedCostInr: trainCost,
      distanceKm: roadKm,
      highlight: "Best value & comfort",
      available: true,
    },
    {
      id: "mode-bus",
      mode: "bus",
      label: "Bus",
      carrier: "Volvo AC / State RTC",
      durationMins: busMins,
      estimatedCostInr: busCost,
      distanceKm: roadKm,
      highlight: "Budget-friendly overnight",
      available: roadKm <= 1200,
    },
    {
      id: "mode-car",
      mode: "car",
      label: "Car / Cab",
      carrier: `${originName.split(",")[0]} → ${destName.split(",")[0]}`,
      durationMins: carMins,
      estimatedCostInr: carCost,
      distanceKm: roadKm,
      highlight: "Flexible highway stops",
      available: roadKm <= 1000,
    },
  ];
}

export function getDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 3;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(14, diff));
}

export function addDaysIso(startDate: string, offset: number): string {
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return startDate;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
