"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FastForward, Hand, ListTree } from "lucide-react";
import type { PermissionMode } from "@/types/task";

type PickerMode = Extract<PermissionMode, "bypassPermissions" | "default" | "plan">;

interface Option {
  value: PickerMode;
  label: string;
  Icon: typeof FastForward;
  color: string;
}

const OPTIONS: Option[] = [
  { value: "bypassPermissions", label: "Auto", Icon: FastForward, color: "var(--cc-status-danger-bright)" },
  { value: "default", label: "Ask", Icon: Hand, color: "var(--cc-status-purple-bright)" },
  { value: "plan", label: "Plan", Icon: ListTree, color: "var(--cc-status-success-bright)" },
];

interface PermissionPickerProps {
  value: PermissionMode;
  onChange: (value: PickerMode) => void;
  disabled?: boolean;
}

export function PermissionPicker({ value, onChange, disabled }: PermissionPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Map any stored permission mode to a picker option.
  const current: PickerMode =
    value === "bypassPermissions" || value === "plan"
      ? value
      : value === "acceptEdits"
        ? "bypassPermissions" // legacy → Auto
        : "default";
  const currentOpt = OPTIONS.find((o) => o.value === current) || OPTIONS[1];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const CurrentIcon = currentOpt.Icon;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Permission mode"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 26,
          padding: "0 8px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--cc-text-secondary)",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "var(--cc-neutral-alpha-04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <CurrentIcon size={13} />
        {currentOpt.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: "100%",
            marginBottom: 6,
            backgroundColor: "var(--cc-surface-soft)",
            border: "1px solid var(--cc-control-bg-active)",
            borderRadius: 10,
            boxShadow: "0 8px 24px var(--cc-neutral-alpha-08)",
            zIndex: 60,
            minWidth: 160,
            padding: 6,
          }}
        >
          <div
            style={{
              padding: "4px 10px 8px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--cc-text-secondary)",
              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
            }}
          >
            Permissions
          </div>
          {OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const isSelected = opt.value === current;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                  color: "var(--cc-text-primary)",
                  backgroundColor: isSelected ? "var(--cc-neutral-alpha-05)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--cc-neutral-alpha-05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected ? "var(--cc-neutral-alpha-05)" : "transparent";
                }}
              >
                <Icon size={15} color="var(--cc-text-secondary)" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
