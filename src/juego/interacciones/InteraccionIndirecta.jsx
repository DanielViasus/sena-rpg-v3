import { useEffect, useMemo } from "react";
import { useAccionesRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";

/**
 * InteraccionIndirecta (ZONA)
 * - NO renderiza sprite (solo registra una zona)
 * - x,y ANCLADOS A PIES (centro-bottom), igual que Jugador/Objeto
 * - Requiere:
 *    - tecla (ej: "E")
 *    - alInteractuar (callback)
 * - NO bloquea movimiento (bloqueaMovimiento: false)
 */
export default function InteraccionIndirecta({
  id,
  x,
  y,
  ancho,
  alto,

  tecla = "E",
  alInteractuar,

  margenZona = 0,
  mostrarDebug = false,
}) {
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();

  // Rect base (anclado a pies: centro-bottom)
  // left = x - ancho/2, top = y - alto
  const rectBase = useMemo(() => {
    const left = Math.round(x - ancho / 2);
    const top = Math.round(y - alto);
    return { x: left, y: top, ancho: Math.round(ancho), alto: Math.round(alto) };
  }, [x, y, ancho, alto]);

  // Rect registro (inflado por margenZona)
  const rectRegistro = useMemo(() => {
    const m = Math.max(0, Math.round(margenZona || 0));
    return {
      x: rectBase.x - m,
      y: rectBase.y - m,
      ancho: rectBase.ancho + m * 2,
      alto: rectBase.alto + m * 2,
    };
  }, [rectBase, margenZona]);

  useEffect(() => {
    if (!id) return;

    upsertCollider(id, rectRegistro, {
      id,
      categoria: "InteraccionIndirecta",
      bloqueaMovimiento: false,
      tecla: String(tecla || "E"),
      alInteractuar,
    });

    return () => removeCollider(id);
  }, [
    id,
    rectRegistro.x,
    rectRegistro.y,
    rectRegistro.ancho,
    rectRegistro.alto,
    tecla,
    alInteractuar,
    upsertCollider,
    removeCollider,
  ]);

  // Debug: morado para diferenciarlo de Pared/Decoration
  const color = "rgba(180, 0, 255, 0.9)";

  return (
    <>
      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: rectRegistro.x,
            top: rectRegistro.y,
            width: rectRegistro.ancho,
            height: rectRegistro.alto,
            border: `2px dashed ${color}`,
            background: "rgba(180, 0, 255, 0.08)",
            pointerEvents: "none",
            boxSizing: "border-box",
            zIndex: 999999,
          }}
          title={`InteraccionIndirecta (${tecla})`}
        />
      )}
    </>
  );
}
