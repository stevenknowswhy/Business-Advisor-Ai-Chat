"use client";

import { useEffect, useRef, useState } from "react";
import { HandThumbUpIcon, HandThumbDownIcon, XMarkIcon } from "@heroicons/react/24/solid";

export type FeedbackOption =
  | "incorrect"
  | "verbose"
  | "instructions"
  | "other";

export function FeedbackControls({
  messageId,
  onSubmit,
}: {
  messageId: string | undefined;
  onSubmit?: (payload: FeedbackPayload) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const handleUp = async () => {
    setShowThanks(true);
    setTimeout(() => setShowThanks(false), 2000);
    const payload: FeedbackPayload = {
      messageId: messageId || "",
      sentiment: "up",
      reason: undefined,
      other: "",
      comments: "",
      createdAt: new Date().toISOString(),
    };
    try { await onSubmit?.(payload); } catch {}
  };

  return (
    <div className="mt-1 flex items-center gap-2 text-gray-400">
      <button
        type="button"
        onClick={handleUp}
        className="inline-flex items-center justify-center p-1 rounded hover:text-blue-600 hover:bg-blue-50"
        aria-label="Thumbs up"
      >
        <HandThumbUpIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center p-1 rounded hover:text-red-600 hover:bg-red-50"
        aria-label="Thumbs down"
      >
        <HandThumbDownIcon className="w-4 h-4" />
      </button>

      {showThanks && (
        <span className="text-xs text-gray-500">Thanks for the feedback!</span>
      )}

      <FeedbackModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async (data) => {
          const payload: FeedbackPayload = {
            messageId: messageId || "",
            sentiment: "down",
            ...data,
            createdAt: new Date().toISOString(),
          };
          try { await onSubmit?.(payload); } catch {}
          setOpen(false);
        }}
      />
    </div>
  );
}

export type FeedbackPayload = {
  messageId: string;
  sentiment: "up" | "down";
  reason?: FeedbackOption;
  other?: string;
  comments?: string;
  createdAt: string;
};

export function FeedbackModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { reason?: FeedbackOption; other?: string; comments?: string }) => void;
}) {
  const [reason, setReason] = useState<FeedbackOption | undefined>(undefined);
  const [other, setOther] = useState("");
  const [comments, setComments] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setReason(undefined); setOther(""); setComments("");
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">Tell us what went wrong</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="fb-reason" value="incorrect" onChange={() => setReason("incorrect")}/>
              Incorrect/Hallucination
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="fb-reason" value="verbose" onChange={() => setReason("verbose")}/>
              Wordy/Overly Verbose
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="fb-reason" value="instructions" onChange={() => setReason("instructions")}/>
              Did not Follow Instructions
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="fb-reason" value="other" onChange={() => setReason("other")}/>
              Other
            </label>
          </div>

          {reason === "other" && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Other (please specify)</label>
              <textarea className="w-full border rounded p-2 text-sm" rows={2} value={other} onChange={e => setOther(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 mb-1">Additional Comments (optional)</label>
            <textarea className="w-full border rounded p-2 text-sm" rows={3} value={comments} onChange={e => setComments(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button className="px-3 py-1.5 text-sm rounded border" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onSubmit({ reason, other, comments })}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

