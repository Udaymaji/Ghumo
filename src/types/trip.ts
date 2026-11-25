export interface GeoCoords {
  lat: number;
  lng: number;
}

export type TravelMode = "walking" | "driving" | "cycling";

export type ActivityCategory =
  | "sightseeing"
  | "food"
  | "transit"
  | "stay"
  | "activity";

export type CurrencyCode = "USD" | "EUR" | "JPY" | "GBP" | "INR";

export type VibeCategory =
  | "Culture & History"
  | "Food & Markets"
  | "Hidden Gems"
  | "Nature & Views";

export interface Activity {
  id: string;
  title: string;
  time: string;
  durationMins: number;
  category: ActivityCategory;
  location: string;
  cost: number;
  notes?: string;
  coords: GeoCoords;
  votes: number;
  votedByMe?: boolean;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface Expense {
  id: string;
  title: string;
  category: ActivityCategory;
  amount: number;
  dayNumber?: number;
  paidBy: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Viewer";
  avatarColor: string;
  initials: string;
}

export interface TripComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface PlaceSuggestion {
  id: string;
  title: string;
  vibe: VibeCategory;
  category: ActivityCategory;
  location: string;
  durationMins: number;
  estimatedCost: number;
  description: string;
  coords: GeoCoords;
  destinationTag: string;
}

export interface TransitOption {
  id: string;
  mode: "plane" | "train" | "bus" | "car";
  label: string;
  carrier: string;
  durationMins: number;
  estimatedCostInr: number;
  distanceKm: number;
  highlight: string;
  available: boolean;
}

export interface Trip {
  id: string;
  name: string;
  origin?: string;
  originCoords?: GeoCoords;
  destination: string;
  startDate: string;
  endDate: string;
  currency: CurrencyCode;
  totalBudget: number;
  centerCoords: GeoCoords;
  coverEmoji: string;
  days: TripDay[];
  expenses: Expense[];
  collaborators: Collaborator[];
  comments: TripComment[];
}
