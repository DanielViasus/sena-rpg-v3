import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAccionesRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";
import Objeto from "../objetos/Objeto.jsx";

/**
 * Teleport (Interacción Indirecta)
 * - Zona de interacción: NO bloquea movimiento (bloqueaMovimiento: false)
 * - Acción: navega a rutaDestino al presionar tecla dentro del área
 * - Visual: renderiza un Objeto "Decoration" para mostrar el portal (opcionalmente puede bloquear)
 */
export default function Teleport({
  // ID de la zona (obligatorio)
  id,

  // Posición (pies, centro-bottom)
  x,
  y,

  // Zona de interacción (rect)
  ancho,
  alto,

  // Tecla y destino
  tecla = "E",
  rutaDestino = "/",

  // Debug
  mostrarDebug = false,

  // Ajustes zona interacción
  offsetX = 0,
  offsetY = 0,
  margenZona = 0,

  /**
   * ✅ Visual del portal (Objeto Decoration)
   * Si no envías portalImagen, no se renderiza el portal visual.
   */
  portalId = null, // si no lo pasas, se autogenera con `${id}__portal`
  portalImagen = null, // URL string o componente SVG (SVGR)
  portalAncho = null,
  portalAlto = null,
  portalColider = null, // collider del Objeto portal (centro-bottom)
  portalBloqueaMovimiento = false, // normalmente false, pero puedes hacerlo true si quieres “bloquear”
}) {
  const navigate = useNavigate();
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();

  // Zona anclada a PIES (centro-bottom)
  const rectBase = useMemo(() => {
    const anclaX = Math.round(x + (offsetX ?? 0));
    const anclaY = Math.round(y + (offsetY ?? 0));

    const left = Math.round(anclaX - ancho / 2);
    const top = Math.round(anclaY - alto);

    return {
      x: left,
      y: top,
      ancho: Math.round(ancho),
      alto: Math.round(alto),
    };
  }, [x, y, ancho, alto, offsetX, offsetY]);

  const rectRegistro = useMemo(() => {
    const m = Math.max(0, margenZona || 0);
    return {
      x: rectBase.x - m,
      y: rectBase.y - m,
      ancho: rectBase.ancho + m * 2,
      alto: rectBase.alto + m * 2,
    };
  }, [rectBase, margenZona]);

  const alInteractuar = useMemo(() => {
    return () => navigate(rutaDestino);
  }, [navigate, rutaDestino]);

  // Registrar zona de interacción indirecta
  useEffect(() => {
    if (!id) return;

    upsertCollider(id, rectRegistro, {
      id,
      categoria: "InteraccionIndirecta",
      tipo: "Teleport",
      tecla,
      rutaDestino,

      // ✅ NO bloquea la grilla A*
      bloqueaMovimiento: false,

      // acción
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
    rutaDestino,
    alInteractuar,
    upsertCollider,
    removeCollider,
  ]);

  // Portal visual
  const pid = portalId || `${id}__portal`;
  const renderPortal = !!portalImagen && Number.isFinite(portalAncho) && Number.isFinite(portalAlto);

  return (
    <>
      {/* ✅ Objeto visual del portal (Decoration) */}
      {renderPortal && (
        <Objeto
          id={pid}
          categoria="Decoration"
          x={x}
          y={y}
          ancho={portalAncho}
          alto={portalAlto}
          imagen={portalImagen}
          colider={portalColider}
          bloqueaMovimiento={!!portalBloqueaMovimiento}
          mostrarDebug={mostrarDebug}
        />
      )}

      {/* ✅ Debug de la zona de interacción (amarillo) */}
      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: rectRegistro.x,
            top: rectRegistro.y,
            width: rectRegistro.ancho,
            height: rectRegistro.alto,
            border: "2px dashed rgba(255, 215, 0, 0.95)",
            background: "rgba(255, 215, 0, 0.08)",
            pointerEvents: "none",
            zIndex: 999997,
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
