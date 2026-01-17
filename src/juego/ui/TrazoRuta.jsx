import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";

/**
 * Dibuja el trazado de la ruta del jugador (pies) en modo debug.
 * - Usa coordenadas de mundo (px).
 * - Se renderiza como overlay SVG dentro del Mundo.
 */
export default function TrazoRuta({
  anchoMundo,
  largoMundo,
  mostrar = true,
  zIndex = 999999,
}) {
  const { jugador } = useEstadoJuego();

  const puntos = useMemo(() => {
    if (!mostrar) return [];
    const ruta = Array.isArray(jugador.ruta) ? jugador.ruta : [];
    const base = [{ x: jugador.x, y: jugador.y }, ...ruta];

    // Elimina puntos consecutivos duplicados (por si el primero coincide)
    const filtrados = [];
    for (const p of base) {
      const prev = filtrados[filtrados.length - 1];
      if (!prev || prev.x !== p.x || prev.y !== p.y) filtrados.push(p);
    }
    return filtrados;
  }, [mostrar, jugador.x, jugador.y, jugador.ruta]);

  const polylinePoints = useMemo(() => {
    if (puntos.length < 2) return "";
    return puntos.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(" ");
  }, [puntos]);

  if (!mostrar) return null;

  return (
    <svg
      width={anchoMundo}
      height={largoMundo}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex,
        pointerEvents: "none",
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      {/* Si no hay ruta, no dibujamos línea, pero sí puedes dejar el punto actual */}
      {puntos.length >= 2 && (
        <>
          {/* Línea principal */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="rgba(0,255,76,0.95)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Línea punteada encima (para contraste) */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="10 10"
            opacity="0.35"
          />
        </>
      )}

      {/* Puntos */}
      {puntos.map((p, i) => {
        const esInicio = i === 0;
        const esFinal = i === puntos.length - 1 && puntos.length > 1;

        const radio = esInicio ? 6 : esFinal ? 7 : 4;
        const color = esInicio
          ? "rgba(255,255,255,0.95)"
          : esFinal
          ? "rgba(255,200,0,0.95)"
          : "rgba(0,255,76,0.9)";

        return (
          <circle
            key={`p_${i}_${p.x}_${p.y}`}
            cx={Math.round(p.x)}
            cy={Math.round(p.y)}
            r={radio}
            fill={color}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
