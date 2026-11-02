"use client";

import type { Scenario } from "./scenarios";

// The custom scenario from the Scenario Builder is kept for the tab's lifetime so the
// demo guide can offer its fixes. It holds fictional data only.
const KEY = "rejectless-custom-scenario";

export function setCustomScenario(s: Scenario) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function getCustomScenario(): Scenario | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Scenario) : undefined;
}
