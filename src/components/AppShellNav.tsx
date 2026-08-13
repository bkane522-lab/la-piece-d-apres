"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Grid2X2, Camera, MessageCircle, UserRound } from "lucide-react";
import { startCaptureFlow } from "@/lib/startCaptureFlow";

const ITEMS = [
  { href: "/espace-client", key: "home", label: "Maison", Icon: Home },
  { href: "/espace-client/pieces", key: "pieces", label: "Pièces", Icon: Grid2X2 },
  { href: "/espace-client/messages", key: "messages", label: "Messages", Icon: MessageCircle },
  { href: "/espace-client/profil", key: "profil", label: "Profil", Icon: UserRound },
];

export function AppShellNav() {
  const pathname = usePathname();
  const [starting, setStarting] = useState(false);

  async function startCapture() {
    if (starting) return;
    setStarting(true);
    try { await startCaptureFlow(); } finally { setStarting(false); }
  }

  return (
    <nav className="app-shell-nav" aria-label="Navigation de l’application">
      {ITEMS.slice(0, 2).map(({ href, key, label, Icon }) => {
        const isActive = pathname === href || (href !== "/espace-client" && pathname.startsWith(href));
        return (
          <Link key={key} href={href} className={`app-shell-nav__item${isActive ? " is-active" : ""}`}>
            <Icon className="app-shell-nav__svg" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
            <span className="app-shell-nav__label">{label}</span>
          </Link>
        );
      })}

      <button type="button" className="app-shell-nav__item app-shell-nav__item--main" onClick={startCapture} disabled={starting} aria-label="Photographier une pièce">
        <span className="app-shell-nav__capture-ring">
          <Camera className="app-shell-nav__capture-icon" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="app-shell-nav__label">{starting ? "…" : "Capturer"}</span>
      </button>

      {ITEMS.slice(2).map(({ href, key, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href);
        return (
          <Link key={key} href={href} className={`app-shell-nav__item${isActive ? " is-active" : ""}`}>
            <Icon className="app-shell-nav__svg" strokeWidth={isActive ? 2.3 : 1.8} aria-hidden="true" />
            <span className="app-shell-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
