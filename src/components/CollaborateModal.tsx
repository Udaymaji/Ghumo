"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Download,
  MessageSquare,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { exportTripToMarkdown } from "@/lib/tripUtils";
import type { Collaborator, Trip } from "@/types/trip";

interface CollaborateModalProps {
  trip: Trip;
  onClose: () => void;
  onInviteMember: (email: string, role: "Editor" | "Viewer") => void;
  onAddComment: (text: string) => void;
}

export default function CollaborateModal({
  trip,
  onClose,
  onInviteMember,
  onAddComment,
}: CollaborateModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Editor" | "Viewer">("Editor");
  const [commentText, setCommentText] = useState("");

  const handleCopyShareLink = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/plan?trip=${trip.id}`
        : `https://ghumo.in/plan?trip=${trip.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleExportMarkdown = async () => {
    const md = exportTripToMarkdown(trip);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch {
      // Fallback to file download
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trip.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between border-b border-[#dde4e9] px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1e3a5f] dark:text-sky-300" />
            <div>
              <h2 className="text-sm font-semibold text-[#142334] dark:text-white">
                Share & Collaborate
              </h2>
              <p className="text-xs text-[#546575] dark:text-slate-400">
                {trip.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-700" />
                  Link copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy share link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
            >
              {copiedMd ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-700" />
                  Exported .md
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Export Markdown
                </>
              )}
            </button>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Members ({trip.collaborators.length})
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="friend@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "Editor" | "Viewer")
                }
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162c49]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </button>
            </form>

            <div className="space-y-1.5">
              {trip.collaborators.map((member: Collaborator) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.initials}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-stone-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
              <MessageSquare className="h-3.5 w-3.5" />
              Notes
            </h3>
            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {trip.comments.length === 0 ? (
                <p className="text-xs text-stone-400">No notes yet.</p>
              ) : (
                trip.comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs dark:border-stone-800 dark:bg-stone-800/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-900 dark:text-white">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {c.createdAt}
                      </span>
                    </div>
                    <p className="mt-1 text-stone-600 dark:text-stone-300">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a note..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162c49]"
              >
                <Send className="h-3.5 w-3.5" />
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
