import { useEffect, useRef } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";
import { calcularGeometriaJugador } from "../entidades/jugador/calculosJugador.js";

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.ancho &&
    a.x + a.ancho > b.x &&
    a.y < b.y + b.alto &&
    a.y + a.alto > b.y
  );
}

export default function SistemaZonasInteraccion({ zonas, spriteJugador }) {
  const { jugador } = useEstadoJuego();
  const { reiniciarJugador, entrarInteraccionIndirecta, salirInteraccionIndirecta } = useAccionesJuego();

  const dentroDirectasRef = useRef(new Set());
  const indirectaActualRef = useRef(null);

  useEffect(() => {
    const g = calcularGeometriaJugador({
      piesX: jugador.x,
      piesY: jugador.y,
      spriteAncho: spriteJugador.ancho,
      spriteAlto: spriteJugador.alto,
      coliderAncho: jugador.colider.ancho,
      coliderAlto: jugador.colider.alto,
      coliderOffsetX: jugador.colider.offsetX,
      coliderOffsetY: jugador.colider.offsetY,
    });

    const col = g.coliderMundo;

    // 1) Directas: dispara SOLO al entrar
    for (const z of zonas.filter((z) => z.tipo === "directa")) {
      const estaDentro = rectsIntersect(col, z);
      const yaDentro = dentroDirectasRef.current.has(z.id);

      if (estaDentro && !yaDentro) {
        dentroDirectasRef.current.add(z.id);

        // Acción demo: reiniciar
        reiniciarJugador();
        return; // importante: al reiniciar, no seguimos procesando este tick
      }

      if (!estaDentro && yaDentro) {
        dentroDirectasRef.current.delete(z.id);
      }
    }

    // 2) Indirectas: si está dentro, activamos estado (y si sale, lo apagamos)
    const zonaIndirecta = zonas.find((z) => z.tipo === "indirecta" && rectsIntersect(col, z)) ?? null;

    if (zonaIndirecta) {
      if (indirectaActualRef.current !== zonaIndirecta.id) {
        indirectaActualRef.current = zonaIndirecta.id;
        entrarInteraccionIndirecta(zonaIndirecta.id, zonaIndirecta.tecla ?? "E");
      }
    } else {
      if (indirectaActualRef.current !== null) {
        indirectaActualRef.current = null;
        salirInteraccionIndirecta();
      }
    }
  }, [jugador.x, jugador.y, jugador.colider, zonas, spriteJugador, reiniciarJugador, entrarInteraccionIndirecta, salirInteraccionIndirecta]);

  return null;
}
