// src/juego/ui/IndicadorInteraccionIndirecta.jsx
import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";

function renderImagen(imagen, id) {
  if (!imagen) return null;

  if (typeof imagen === "string") {
    return (
      <img
        src={imagen}
        alt={id || "icono"}
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />
    );
  }

  const Comp = imagen; // SVGR
  return <Comp width="100%" height="100%" />;
}

export default function IndicadorInteraccionIndirecta({
  imagen,
  tam = 128,
  altoJugador = 128,
  offsetX = 0,
  offsetY = 0,
}) {
  const { jugador, interaccionIndirecta } = useEstadoJuego();

  if (!interaccionIndirecta?.activa) return null;

  const left = Math.round(jugador.x - tam / 2 + offsetX);
  const top = Math.round(jugador.y - altoJugador - tam + offsetY);

  const zIndex = useMemo(() => {
    // siempre encima del jugador y objetos
    return Math.max(99999, Math.round(jugador.y) + 30000);
  }, [jugador.y]);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: tam,
        height: tam,
        zIndex,
        pointerEvents: "none",
      }}
    >
      {renderImagen(imagen, "indicador_interaccion_indirecta")}
    </div>
  );
}
