"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity, Clock, Cpu, FileText, Settings,
} from "lucide-react";
import { useGsdSync } from "@/hooks/use-gsd-sync";
import { FeedView } from "@/components/board/feed-view";
import { BrandContextBanner } from "@/components/board/brand-context-banner";
import { CronJobsView } from "@/components/cron/cron-table";
import { SkillsFileTree } from "@/components/skills/skills-file-tree";
import { SkillsSummary } from "@/components/skills/skills-summary";
import { SkillUploadModal } from "@/components/skills/skill-upload-modal";
import { ContentViewer } from "@/components/context/content-viewer";
import { DocsFileTree } from "@/components/docs/docs-file-tree";
import { ResizablePane } from "@/components/shared/resizable-pane";
import {
  SettingsTabs,
  type SettingsTabId,
} from "@/components/settings/settings-tabs";
import { ScriptList } from "@/components/settings/script-list";
import { EnvEditor } from "@/components/settings/env-editor";
import { JsonEditor } from "@/components/settings/json-editor";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ClientSwitcher } from "@/components/layout/client-switcher";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useTaskStore } from "@/store/task-store";
import { useClientStore } from "@/store/client-store";
type Tab = "feed" | "scheduled" | "skills" | "docs" | "settings";

/** Skills tab content */
function SkillsTab() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <div style={{
        display: "flex",
        minHeight: "calc(100vh - 140px)",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--cc-line-alpha-15)",
      }}>
        <div style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: "var(--cc-surface-muted)",
          overflowY: "auto",
          borderRight: "1px solid var(--cc-line-alpha-20)",
        }}>
          <SkillsFileTree
            key={refreshKey}
            onSelectFile={setSelectedPath}
            selectedPath={selectedPath}
          />
        </div>
        <div style={{ flex: 1, backgroundColor: "var(--cc-surface)", minHeight: 400 }}>
          {selectedPath ? (
            <div>
              <button
                onClick={() => setSelectedPath(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  border: "none",
                  borderBottom: "1px solid var(--cc-line-alpha-20)",
                  background: "transparent",
                  color: "var(--cc-brand-primary)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cc-brand-alpha-04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                &larr; All Skills
              </button>
              <ContentViewer
                selectedPath={selectedPath}
                onFileDeleted={() => { setSelectedPath(null); setRefreshKey((k) => k + 1); }}
              />
            </div>
          ) : (
            <SkillsSummary
              onSelectSkill={setSelectedPath}
              onAddSkill={() => setShowUpload(true)}
            />
          )}
        </div>
      </div>
      {showUpload && (
        <SkillUploadModal
          onClose={() => setShowUpload(false)}
          onComplete={() => { setShowUpload(false); setRefreshKey((k) => k + 1); }}
        />
      )}
    </>
  );
}

/** Docs tab content */
function DocsTab({ initialFile }: { initialFile?: string | null }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    initialFile || "AGENTS.md"
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep selection in sync with URL param when it changes (e.g. clicking
  // another output while already on the Docs tab).
  useEffect(() => {
    if (initialFile) setSelectedPath(initialFile);
  }, [initialFile]);

  return (
    <ResizablePane
      storageKey="docs-sidebar-width"
      initialLeft={260}
      minLeft={180}
      maxLeft={600}
      style={{ minHeight: "calc(100vh - 140px)", gap: 0 }}
      left={
        <div style={{
          backgroundColor: "var(--cc-surface-muted)",
          borderRadius: 8,
          overflowY: "auto",
          maxHeight: "calc(100vh - 140px)",
          width: "100%",
        }}>
          <DocsFileTree key={refreshKey} onSelectFile={setSelectedPath} selectedPath={selectedPath} />
        </div>
      }
      right={
        <div style={{
          backgroundColor: "var(--cc-surface)",
          borderRadius: 8,
          minHeight: 400,
          width: "100%",
        }}>
          <ContentViewer
            selectedPath={selectedPath}
            onFileDeleted={() => { setSelectedPath(null); setRefreshKey((k) => k + 1); }}
          />
        </div>
      }
    />
  );
}

/** Settings tab content */
function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTabId>("scripts");

  return (
    <div>
      <SettingsTabs activeTab={activeSubTab} onTabChange={setActiveSubTab} />
      <div style={{ minHeight: 400 }}>
        {activeSubTab === "env" && <EnvEditor />}
        {activeSubTab === "mcp" && (
          <JsonEditor
            apiEndpoint="/api/settings/mcp"
            title="MCP Configuration"
            description="Edit .mcp.json \u2014 MCP server connections and their environment variables"
            emptyMessage="No .mcp.json file found. Create one to configure MCP servers."
            maskSecrets
          />
        )}
        {activeSubTab === "claude" && (
          <JsonEditor
            apiEndpoint="/api/settings/claude-settings"
            title="Claude Settings"
            description="Edit .claude/settings.json \u2014 permissions, allowed tools, and deny patterns"
            emptyMessage="No .claude/settings.json file found. Create one to configure Claude CLI settings."
          />
        )}
        {activeSubTab === "scripts" && <ScriptList />}
        {activeSubTab === "appearance" && <AppearanceSettings />}
      </div>
    </div>
  );
}

const VALID_TABS: Tab[] = ["feed", "scheduled", "skills", "docs", "settings"];

function CommandCentreBody() {
  useGsdSync();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const fileParam = searchParams.get("file");
  const taskParam = searchParams.get("task");
  const searchParamsString = searchParams.toString();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const openPanel = useTaskStore((s) => s.openPanel);
  const setSelectedClient = useClientStore((s) => s.setSelectedClient);

  const [activeTab, setActiveTab] = useState<Tab>(
    (VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "feed")
  );

  // If the URL params change (e.g. another tab clicked an output link
  // while already on this page), re-sync the active tab.
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as Tab)) {
      setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!taskParam) return;

    let cancelled = false;

    const openDeepLinkedTask = async () => {
      setActiveTab("feed");

      try {
        const res = await fetch(`/api/tasks/${encodeURIComponent(taskParam)}`);
        if (!res.ok) return;

        const task = await res.json();
        if (cancelled) return;

        setSelectedClient(task.clientId ?? null);
        await fetchTasks();
        if (cancelled) return;

        openPanel(task.id);
      } finally {
        if (cancelled) return;

        const params = new URLSearchParams(searchParamsString);
        params.delete("task");
        params.set("tab", "feed");
        const nextQuery = params.toString();
        router.replace(nextQuery ? `/?${nextQuery}` : "/");
      }
    };

    void openDeepLinkedTask();

    return () => {
      cancelled = true;
    };
  }, [taskParam, searchParamsString, router, fetchTasks, openPanel, setSelectedClient]);
  const switchTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as Tab);
      // Clear stale query params (like ?file=) when the user manually
      // navigates away from docs.
      if (tab !== "docs" && (tabParam || fileParam)) {
        router.replace("/");
      }
    },
    [router, tabParam, fileParam]
  );

  const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
    { key: "feed", label: "Feed", icon: Activity },
    { key: "scheduled", label: "Scheduled", icon: Clock },
    { key: "skills", label: "Skills", icon: Cpu },
    { key: "docs", label: "Docs", icon: FileText },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--cc-canvas)" }}>
      <OnboardingModal />

      {/* Top bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 52,
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--cc-canvas-overlay-92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--cc-line-alpha-10)",
        overflowX: "auto",
        overflowY: "hidden",
      }}>
        {/* Left: branding + tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a
            href="https://skool.com/scrapes"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <img src="/logo.png" alt="All The Power" style={{ width: "auto", height: 26, display: "block" }} />
            <h1 style={{
              fontFamily: "'BN Dime Display', var(--font-epilogue), Epilogue, sans-serif",
              fontWeight: 400,
              fontSize: 20,
              color: "var(--cc-text-primary)",
              letterSpacing: "0.01em",
              margin: 0,
              marginTop: 2,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}>
              All The Power
            </h1>
          </a>

          <div style={{
            width: 1,
            height: 20,
            backgroundColor: "var(--cc-line-alpha-30)",
          }} />

          <nav style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: isActive ? "var(--cc-brand-alpha-08)" : "transparent",
                    color: isActive ? "var(--cc-brand-primary)" : "var(--cc-text-secondary)",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: spacer */}
        <div />
      </header>

      <div style={{ padding: "12px 24px 0" }}>
        <div style={{ maxWidth: 280 }}>
          <ClientSwitcher direction="down" />
        </div>
      </div>
      <BrandContextBanner />

      {/* Content */}
      <main style={{ padding: "16px 24px 24px" }}>
        {activeTab === "feed" && (
          <FeedView onSwitchTab={switchTab} />
        )}
        {activeTab === "scheduled" && <CronJobsView />}
        {activeTab === "skills" && <SkillsTab />}
        {activeTab === "docs" && <DocsTab initialFile={fileParam} />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

export default function CommandCentrePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "var(--cc-canvas)" }} />}>
      <CommandCentreBody />
    </Suspense>
  );
}
