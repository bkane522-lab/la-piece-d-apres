"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

const ITEMS = [
  { href: "/espace-client", key: "home", label: "Maison", icon: "⌂" },
  { href: "/espace-client/pieces", key: "pieces", label: "Mes pièces", icon: "▦" },
  { href: "/espace-client/messages", key: "messages", label: "Messages", icon: "✉" },
  { href: "/espace-client/profil", key: "profil", label: "Profil", icon: "◑" },
];

export function AppShellNav() {
  const pathname = usePathname();
  const [starting, setStarting] = useState(false);

  async function startCapture() {
    setStarting(true);
    try { await startCaptureFlow(); } finally { setStarting(false); }
  }

  return (
    <nav className="app-shell-nav" aria-label="Navigation de l’application">
      {ITEMS.slice(0, 2).map((item) => {
        const isActive = pathname === item.href || (item.href !== "/espace-client" && pathname.startsWith(item.href));
        return (
          <Link key={item.key} href={item.href} className={`app-shell-nav__item${isActive ? " is-active" : ""}`}>
            <span className="app-shell-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="app-shell-nav__label">{item.label}</span>
          </Link>
        );
      })}

      <button type="button" className="app-shell-nav__item app-shell-nav__item--main" onClick={startCapture} disabled={starting}>
        <span className="app-shell-nav__icon" aria-hidden="true">◎</span>
        <span className="app-shell-nav__label">{starting ? "…" : "Capturer"}</span>
      </button>

      {ITEMS.slice(2).map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href);
        return (
          <Link key={item.key} href={item.href} className={`app-shell-nav__item${isActive ? " is-active" : ""}`}>
            <span className="app-shell-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="app-shell-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
