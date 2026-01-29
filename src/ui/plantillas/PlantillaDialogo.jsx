// src/ui/plantillas/PlantillaDialogo.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";
import { obtenerLineasDialogo } from "../../narrativa/dialogos/Dialogos.js";

function normalizarTecla(t) {
  return (t || "").toString().trim().toUpperCase();
}

/**
 * PlantillaDialogo (Overlay narrativa estilo "letterbox")
 * - Barras negras arriba/abajo
 * - Caja inferior con texto
 * - Avanza con tecla (default E)
 * - Cierra al terminar
 */
export default function PlantillaDialogo() {
  const estado = useEstadoJuego();
  const { cerrarPlantilla } = useAccionesJuego();

  const activa = estado.ui?.plantillaActiva ?? null;
  const esEsta = activa?.id === "DIALOGO";
  const props = activa?.props || {};

  if (!esEsta) return null;

  const tecla = normalizarTecla(props.tecla || "E");
  const dialogoId = props.dialogoId || "Isaias";
  const secuenciaId = props.secuenciaId || "aperturaPortal";

  const lineas = useMemo(() => {
    return obtenerLineasDialogo(dialogoId, secuenciaId);
  }, [dialogoId, secuenciaId]);

  const [idx, setIdx] = useState(0);

  // Refs para que el listener no dependa de idx/props inline
  const idxRef = useRef(0);
  const propsRef = useRef(props);

  useEffect(() => void (idxRef.current = idx), [idx]);
  useEffect(() => void (propsRef.current = props), [props]);

  // Reset cuando cambia diálogo/secuencia/origen
  useEffect(() => {
    setIdx(0);
    idxRef.current = 0;
  }, [dialogoId, secuenciaId, activa?.origenZonaId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (normalizarTecla(e.key) !== tecla) return;

      // ✅ Consumir la tecla totalmente (evita que otros listeners en window disparen "abrir" otra vez)
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

      const i = idxRef.current;

      // Si no hay líneas, cierra
      if (lineas.length === 0) {
        cerrarPlantilla();
        return;
      }

      const esUltima = i >= lineas.length - 1;

      if (esUltima) {
        cerrarPlantilla();

        const p = propsRef.current;
        if (typeof p.onFinish === "function") {
          p.onFinish({
            dialogoId,
            secuenciaId,
            origenZonaId: activa?.origenZonaId ?? null,
          });
        }
        return;
      }

      // Avanzar 1 línea
      setIdx(i + 1);
    };

    // capture=true (para ganar prioridad) + stopImmediatePropagation (para cortar otros listeners en window)
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [tecla, lineas.length, cerrarPlantilla, dialogoId, secuenciaId, activa?.origenZonaId]);

  const texto = lineas[idx] ?? "";
  const esUltima = idx >= lineas.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {/* Barra superior */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "18%",
          background: "rgba(0,0,0,0.95)",
        }}
      />

      {/* Centro */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "18%",
          bottom: "28%",
          background: "rgba(0,0,0,0.0)",
        }}
      />

      {/* Barra inferior */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "28%",
          background: "rgba(0,0,0,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "min(900px, 92vw)",
            color: "white",
            fontSize: 18,
            lineHeight: 1.35,
          }}
        >
          <div style={{ marginBottom: 10, opacity: 0.95 }}>{texto}</div>

          <div style={{ display: "flex", justifyContent: "flex-end", opacity: 0.75, fontSize: 14 }}>
            {esUltima ? `${tecla} PARA CERRAR` : `${tecla} PARA CONTINUAR`}
          </div>
        </div>
      </div>
    </div>
  );
}
