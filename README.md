# GHUMO — Trip Planner & Route Explorer

A modern, full-featured Trip Planner built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Leaflet**, **OSRM**, and **Photon (OpenStreetMap)** — running 100% free with zero paid API keys.

## Features

- **From → To Route Finder (`/`)**: Autocomplete origin and destination cities via Photon, choose travel dates and budget (`₹ INR`), and optionally auto-plan the entire multi-day itinerary.
- **Travel Mode Comparison (`/plan/transit`)**: Compare estimated duration, distance, and fares across **Flight**, **Train**, **Bus**, and **Car/Cab** and add your choice directly to Day 1.
- **Day-by-Day Itinerary & Collapsible Map (`/plan`)**: Auto-plan all selected days or add/reorder/upvote stops with live OpenStreetMap pins, OSRM walking/driving/cycling routes, and live GPS tracking.
- **Place Suggestions (`/plan/suggestions`)**: Filter curated spots by travel vibe or search OpenStreetMap places near your destination.
- **Budget & Expenses (`/plan/budget`)**: Track planned spend vs. editable budget, multi-currency support (`INR`, `USD`, `EUR`, `GBP`, `JPY`), category breakdowns, and extra bookings.
- **Share & Export**: Copy share links, invite collaborators (`Editor` / `Viewer`), post group notes, and export itineraries to Markdown (`.md`).

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Mapping & Routing**: Leaflet + OpenStreetMap tiles + OSRM Public Routing API + Photon Geocoding API
- **Persistence**: Browser `localStorage`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Ready for zero-config deployment on **Vercel** (no environment variables required).
