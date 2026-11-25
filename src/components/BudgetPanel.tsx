"use client";

import React, { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { CATEGORY_LABELS, formatMoney, getDayColor } from "@/lib/tripUtils";
import type { ActivityCategory, CurrencyCode, Expense, Trip } from "@/types/trip";

interface BudgetPanelProps {
  trip: Trip;
  onUpdateBudget: (totalBudget: number) => void;
  onUpdateCurrency: (currency: CurrencyCode) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CURRENCIES: CurrencyCode[] = ["INR", "USD", "EUR", "GBP", "JPY"];
const CATEGORIES: ActivityCategory[] = [
  "stay",
  "food",
  "transit",
  "sightseeing",
  "activity",
];

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  stay: "bg-[#1e3a5f]",
  food: "bg-[#2f6b55]",
  transit: "bg-[#546575]",
  sightseeing: "bg-[#3d6b82]",
  activity: "bg-[#6b7d65]",
};

export default function BudgetPanel({
  trip,
  onUpdateBudget,
  onUpdateCurrency,
  onAddExpense,
  onDeleteExpense,
}: BudgetPanelProps) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(trip.totalBudget));

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("stay");
  const paidBy = trip.collaborators[0]?.name.split(" ")[0] || "You";

  const stats = useMemo(() => {
    const byCategory: Record<ActivityCategory, number> = {
      sightseeing: 0,
      food: 0,
      transit: 0,
      stay: 0,
      activity: 0,
    };
    const byDay: Record<number, number> = {};

    let activityTotal = 0;
    for (const day of trip.days) {
      let daySum = 0;
      for (const act of day.activities) {
        activityTotal += act.cost;
        daySum += act.cost;
        byCategory[act.category] = (byCategory[act.category] ?? 0) + act.cost;
      }
      byDay[day.dayNumber] = daySum;
    }

    let expenseTotal = 0;
    for (const exp of trip.expenses) {
      expenseTotal += exp.amount;
      byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount;
      if (exp.dayNumber) {
        byDay[exp.dayNumber] = (byDay[exp.dayNumber] ?? 0) + exp.amount;
      }
    }

    const totalSpent = activityTotal + expenseTotal;
    const pct =
      trip.totalBudget > 0
        ? Math.min(100, Math.round((totalSpent / trip.totalBudget) * 100))
        : 0;
    const isOver = trip.totalBudget > 0 && totalSpent > trip.totalBudget;

    return { totalSpent, byCategory, byDay, pct, isOver };
  }, [trip]);

  const handleSaveBudget = () => {
    const parsed = Number(budgetDraft);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onUpdateBudget(parsed);
    }
    setEditingBudget(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount: numericAmount,
      category,
      paidBy: paidBy.trim() || "You",
    });
    setTitle("");
    setAmount("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#d7e0e6] bg-[#f7f9fa] p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#546575] dark:text-slate-400">
              <Wallet className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-sky-300" />
              Planned spend
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#142334] dark:text-white">
                {formatMoney(stats.totalSpent, trip.currency)}
              </span>
              <span className="text-xs text-[#546575] dark:text-slate-400">
                of{" "}
                {editingBudget ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={budgetDraft}
                      onChange={(e) => setBudgetDraft(e.target.value)}
                      className="w-24 rounded border border-[#1e3a5f] bg-white px-1.5 py-0.5 text-xs text-[#18222f] dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveBudget}
                      className="rounded bg-[#1e3a5f] p-0.5 text-white hover:bg-[#162c49]"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBudgetDraft(String(trip.totalBudget));
                      setEditingBudget(true);
                    }}
                    className="inline-flex items-center gap-1 font-medium text-[#1e3a5f] underline decoration-dotted hover:text-[#162c49] dark:text-sky-300"
                  >
                    {formatMoney(trip.totalBudget, trip.currency)}
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </span>
            </div>
          </div>

          <select
            value={trip.currency}
            onChange={(e) => onUpdateCurrency(e.target.value as CurrencyCode)}
            aria-label="Trip currency"
            className="rounded-md border border-[#d6dfe5] bg-white px-2 py-1 text-xs font-medium text-[#18222f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {CURRENCIES.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dde4e9] dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                stats.isOver
                  ? "bg-rose-600"
                  : stats.pct > 85
                  ? "bg-amber-600"
                  : "bg-[#2f6b55]"
              }`}
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>{stats.pct}% used</span>
            {stats.isOver ? (
              <span className="font-medium text-rose-600 dark:text-rose-400">
                Over by {formatMoney(stats.totalSpent - trip.totalBudget, trip.currency)}
              </span>
            ) : (
              <span>
                {formatMoney(
                  Math.max(0, trip.totalBudget - stats.totalSpent),
                  trip.currency
                )}{" "}
                left
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400">
          By category
        </h4>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => {
            const val = stats.byCategory[cat] ?? 0;
            const share =
              stats.totalSpent > 0
                ? Math.round((val / stats.totalSpent) * 100)
                : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-700 dark:text-stone-300">
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {formatMoney(val, trip.currency)}{" "}
                    <span className="text-stone-400">({share}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[cat]}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400">
          Per day
        </h4>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {trip.days.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border border-stone-200 px-2.5 py-1.5 text-xs dark:border-stone-800"
            >
              <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getDayColor(d.dayNumber) }}
                />
                Day {d.dayNumber}
              </span>
              <span className="font-medium text-stone-900 dark:text-white">
                {formatMoney(stats.byDay[d.dayNumber] ?? 0, trip.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400">
          Extra bookings & expenses
        </h4>
        <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {trip.expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-800 dark:text-stone-100">
                  {exp.title}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {CATEGORY_LABELS[exp.category]} · {exp.paidBy}
                </p>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <span className="font-medium text-stone-900 dark:text-white">
                  {formatMoney(exp.amount, trip.currency)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteExpense(exp.id)}
                  title="Delete expense"
                  className="text-stone-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-12 gap-1.5 pt-1">
          <input
            type="text"
            placeholder="Hotel, train, pass..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-5 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
          <input
            type="number"
            min={0}
            placeholder="Cost"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="col-span-3 rounded-md border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ActivityCategory)}
            className="col-span-3 rounded-md border border-stone-200 bg-white px-1.5 py-1.5 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            title="Add expense"
            className="col-span-1 flex items-center justify-center rounded-md bg-[#1e3a5f] text-white hover:bg-[#162c49]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
