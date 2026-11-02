import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace/Shell";

export const metadata: Metadata = { title: "Workspace", robots: { index: false } };

// Workspace pages render from the session stored in this browser's IndexedDB, so
// there is nothing meaningful to prerender; the shell shows its own loading state.
export const instant = false;

export default function WorkspaceLayout({ children }: LayoutProps<"/workspace">) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
