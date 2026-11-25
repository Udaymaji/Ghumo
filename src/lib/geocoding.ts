import type { GeoCoords, TravelMode } from "@/types/trip";

export interface PlaceResult {
  name: string;
  subtitle: string;
  coords: GeoCoords;
}

export interface OSRMLegStat {
  distanceMeters: number;
  durationSeconds: number;
}

export interface OSRMRouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  legs: OSRMLegStat[];
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    osm_value?: string;
  };
}

export async function searchPlaces(
  query: string,
  bias?: GeoCoords
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "6",
    lang: "en",
  });

  if (bias) {
    params.set("lat", String(bias.lat));
    params.set("lon", String(bias.lng));
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];

  return features
    .filter((f) => Array.isArray(f.geometry?.coordinates) && f.geometry!.coordinates!.length >= 2)
    .map((f) => {
      const [lng, lat] = f.geometry!.coordinates!;
      const p = f.properties ?? {};
      const name =
        p.name ||
        [p.street, p.housenumber].filter(Boolean).join(" ") ||
        p.city ||
        p.town ||
        trimmed;
      const locality = p.city || p.town || p.village || p.state;
      const subtitle = [locality, p.country, p.osm_value]
        .filter(Boolean)
        .join(" • ");

      return {
        name,
        subtitle: subtitle || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        coords: { lat, lng },
      };
    });
}

const OSRM_PROFILE: Record<TravelMode, string> = {
  walking: "foot",
  driving: "driving",
  cycling: "bike",
};

export async function fetchOSRMRoute(
  waypoints: GeoCoords[],
  mode: TravelMode
): Promise<OSRMRouteResult | null> {
  if (waypoints.length < 2) return null;

  const profile = OSRM_PROFILE[mode];
  const coordStr = waypoints.map((pt) => `${pt.lng},${pt.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry?: { coordinates?: [number, number][] };
      legs?: Array<{ distance: number; duration: number }>;
    }>;
  };

  if (data.code !== "Ok" || !data.routes?.length) return null;

  const route = data.routes[0];
  const rawCoords = route.geometry?.coordinates ?? [];
  const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [
    lat,
    lng,
  ]);

  return {
    coordinates,
    distanceMeters: route.distance ?? 0,
    durationSeconds: route.duration ?? 0,
    legs: (route.legs ?? []).map((leg) => ({
      distanceMeters: leg.distance ?? 0,
      durationSeconds: leg.duration ?? 0,
    })),
  };
}
