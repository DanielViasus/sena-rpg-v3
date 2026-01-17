import React, { useMemo } from "react";

export default function IndicadorInteraccion({
  x,
  y, // pies del jugador
  tam = 128,
  imagen,
  spriteAltoJugador = 128,
  gap = 8,
  zIndex = 999998,
  mostrarDebug = false,
}) {
  const pos = useMemo(() => {
    const left = Math.round(x - tam / 2);
    const top = Math.round(y - spriteAltoJugador - gap - tam);
    return { left, top };
  }, [x, y, tam, spriteAltoJugador, gap]);

  if (!imagen) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: tam,
        height: tam,
        zIndex,
        pointerEvents: "none",
      }}
    >
      <img
        src={imagen}
        alt="Indicador Interacción"
        style={{ width: "100%", height: "100%", display: "block" }}
        draggable={false}
      />

      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            border: "1px dashed rgba(255,255,255,0.7)",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}
