import { AppShellNav } from "@/components/AppShellNav";

export default function EspaceClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-shell__content">{children}</div>
      <AppShellNav />
    </div>
  );
}
