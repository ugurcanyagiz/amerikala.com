import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  mainClassName = "",
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="ak-page">
      <div className="app-shell">
        <Sidebar />
        <main className={`app-shell-main app-page-container ${mainClassName}`.trim()}>{children}</main>
      </div>
    </div>
  );
}
