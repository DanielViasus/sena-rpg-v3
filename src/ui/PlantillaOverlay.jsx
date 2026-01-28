import { useEffect, useMemo } from "react";
import { useAccionesJuego, useEstadoJuego } from "../estado/EstadoJuego.jsx";
import { REGISTRO_PLANTILLAS } from "./registroPlantillas.js";

export default function PlantillaOverlay() {
  const estado = useEstadoJuego();
  const { cerrarPlantilla } = useAccionesJuego();

  const activa = estado.ui?.plantillaActiva;

  const Componente = useMemo(() => {
    if (!activa?.id) return null;
    return REGISTRO_PLANTILLAS[activa.id] || null;
  }, [activa?.id]);

  useEffect(() => {
    if (!activa) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") cerrarPlantilla();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activa, cerrarPlantilla]);

  if (!activa || !Componente) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999999,
      }}
    >
      <div style={{ width: "90%", maxWidth: 700, background: "#111", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={cerrarPlantilla}>X</button>
        </div>

        <Componente {...(activa.props || {})} />
      </div>
    </div>
  );
}
