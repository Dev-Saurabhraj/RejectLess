"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/store/session";
import { getApplication } from "@/knowledge/applications";
import { onDocProgress } from "@/lib/actions";
import { getScenario } from "@/demo/scenarios";
import { loadPreview } from "@/lib/store/session";

export function useActiveSession() {
  const session = useSession((s) => s.session);
  const hydrated = useSession((s) => s.hydrated);
  const app = session ? getApplication(session.appId) : undefined;
  const variant = app?.variants.find((v) => v.id === session?.variantId);
  const latestRun = session?.runs[session.runs.length - 1];
  const scenario = session?.demoScenarioId ? getScenario(session.demoScenarioId) : undefined;
  return { session, hydrated, app, variant, latestRun, scenario };
}

export function useDocProgress(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(
    () =>
      onDocProgress((id, stage) =>
        setMap((m) => {
          const next = { ...m };
          if (stage) next[id] = stage;
          else delete next[id];
          return next;
        }),
      ),
    [],
  );
  return map;
}

/** Object URL for a stored page preview; revoked on unmount. */
export function usePreviewUrl(docId: string | undefined, page = 1, version = 0): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!docId) return;
    let u: string | undefined;
    let cancelled = false;
    loadPreview(docId, page).then((b) => {
      if (b && !cancelled) {
        u = URL.createObjectURL(b);
        setUrl(u);
      }
    });
    return () => {
      cancelled = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [docId, page, version]);
  return url;
}
