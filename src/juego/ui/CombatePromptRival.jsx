import { useMemo } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

export default function CombatePromptRival() {
  const estado = useEstadoJuego();
  const { cerrarPlantilla, derrotarEnemigo, jugadorRecibirDanio } = useAccionesJuego();

  const plantilla = estado.ui?.plantillaActiva;

  // Solo renderiza si esta plantilla es la de combate
  if (!plantilla || plantilla.id !== "COMBATE_RIVAL") return null;

  const origenZonaId = plantilla.origenZonaId; // <- Rival id
  const props = plantilla.props || {};

  const titulo = props.titulo ?? "COMBATE";
  const texto = props.texto ?? "¿Qué quieres hacer?";
  const danioPerder = Number.isFinite(props.danioPerder) ? props.danioPerder : 1;

  const vidas = estado.jugador.vidas ?? 0;
  const escudos = estado.jugador.escudos ?? 0;

  const puedeMarcarDerrota = !!origenZonaId;

  function onGanar() {
    if (puedeMarcarDerrota) derrotarEnemigo(origenZonaId);
    cerrarPlantilla();
  }

  function onPerder() {
    jugadorRecibirDanio(danioPerder);
    cerrarPlantilla();
  }

  function onCerrar() {
    cerrarPlantilla();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: 520,
          maxWidth: "92vw",
          border: "2px solid rgba(255,255,255,0.35)",
          background: "rgba(20,20,20,0.92)",
          padding: 16,
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{titulo}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Vidas: {vidas} | Escudos: {escudos}
            </div>
          </div>

          <button onClick={onCerrar} style={{ cursor: "pointer" }}>
            Cerrar
          </button>
        </div>

        <div style={{ marginTop: 12, lineHeight: 1.35 }}>{texto}</div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onGanar} style={{ cursor: "pointer", flex: 1 }}>
            Ganar
          </button>
          <button onClick={onPerder} style={{ cursor: "pointer", flex: 1 }}>
            Perder
          </button>
        </div>
      </div>
    </div>
  );
}
