"use client";

import Image from "next/image";

export function DoorPhoto({ intensified = false }: { intensified?: boolean }) {
  return (
    <div className={`door-photo${intensified ? " door-photo--intense" : ""}`}>
      <Image
        src="/hero/porte-travertin.jpg"
        alt="Arche en pierre claire et bois chaud, lumière dorée — ouverture vers un intérieur, La Pièce d’Après"
        fill
        priority
        sizes="(max-width: 900px) 100vw, 480px"
        className="door-photo__img"
      />
      <div className="door-photo__glow" aria-hidden="true" />
    </div>
  );
}
