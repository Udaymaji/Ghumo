"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BudgetPanel from "@/components/BudgetPanel";
import PlanShell from "@/components/PlanShell";
import { useTripsStore } from "@/lib/useTripsStore";
import type { Expense } from "@/types/trip";

function BudgetPageContent() {
  const {
    trips,
    activeTrip,
    setActiveTripId,
    updateActiveTrip,
    resetDemo,
  } = useTripsStore();

  return (
    <PlanShell
      trips={trips}
      activeTrip={activeTrip}
      onSelectTrip={setActiveTripId}
      onUpdateTrip={updateActiveTrip}
      onResetDemo={resetDemo}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#142334] dark:text-white">
              Budget & Expenses
            </h1>
            <p className="text-xs text-[#546575] dark:text-slate-400">
              Track planned costs, per-day spending, and extra bookings for{" "}
              {activeTrip.name}
            </p>
          </div>
          <Link
            href={`/plan?trip=${encodeURIComponent(activeTrip.id)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6dfe5] bg-white px-3.5 py-2 text-xs font-medium text-[#1e3a5f] hover:bg-[#f3f6f8] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
          >
            Back to Itinerary
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-[#d7e0e6] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <BudgetPanel
            trip={activeTrip}
            onUpdateBudget={(totalBudget) =>
              updateActiveTrip((t) => ({ ...t, totalBudget }))
            }
            onUpdateCurrency={(currency) =>
              updateActiveTrip((t) => ({ ...t, currency }))
            }
            onAddExpense={(exp: Omit<Expense, "id">) =>
              updateActiveTrip((t) => ({
                ...t,
                expenses: [
                  ...t.expenses,
                  { ...exp, id: `exp-${Date.now().toString(36)}` },
                ],
              }))
            }
            onDeleteExpense={(expenseId) =>
              updateActiveTrip((t) => ({
                ...t,
                expenses: t.expenses.filter((e) => e.id !== expenseId),
              }))
            }
          />
        </div>
      </div>
    </PlanShell>
  );
}

export default function BudgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#546575]">
          Loading budget…
        </div>
      }
    >
      <BudgetPageContent />
    </Suspense>
  );
}
