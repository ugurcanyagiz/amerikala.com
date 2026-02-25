import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  mainClassName = "app-page-container",
}: {
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="ak-page">
      <div className="app-shell">
        <Sidebar />
        <main className={`app-shell-main ${mainClassName}`}>{children}</main>
      </div>
    </div>
  );
}
