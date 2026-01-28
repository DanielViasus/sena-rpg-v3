// src/juego/personajes/tutorial/PersonajeTutorial.jsx
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAccionesRegistroColisiones } from "../../colisiones/RegistroColisiones.jsx";
import { useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import Objeto from "../../objetos/Objeto.jsx";

/**
 * PersonajeTutorial (Interacción Indirecta)
 * - Zona de interacción: NO bloquea movimiento (bloqueaMovimiento: false)
 * - Acción: abre una plantilla por ID (estado global)
 * - Visual: renderiza un Objeto "Decoration" para mostrar el NPC (opcional)
 *
 * ✅ Importante: usa refs para plantillaProps/plantillaId para evitar bucles de render
 * (Maximum update depth exceeded) cuando el padre pasa objetos inline.
 */
export default function PersonajeTutorial({
  // ID de la zona (obligatorio)
  id,

  // Posición (pies, centro-bottom)
  x,
  y,

  // Zona de interacción (rect)
  ancho,
  alto,

  // Tecla para interactuar
  tecla = "E",

  // ✅ Plantilla que se abre (por ID)
  plantillaId, // ej: "TUTO_MOVIMIENTO"
  plantillaProps = {},

  // Debug
  mostrarDebug = false,

  // Ajustes zona interacción
  offsetX = 0,
  offsetY = 0,
  margenZona = 0,

  /**
   * ✅ Visual del NPC (Objeto Decoration)
   * Si no envías npcImagen, no se renderiza el NPC visual.
   */
  npcId = null, // si no lo pasas, se autogenera con `${id}__npc`
  npcImagen = null, // URL string o componente SVG (SVGR)
  npcAncho = null,
  npcAlto = null,
  npcColider = null, // collider del Objeto (centro-bottom)
  npcBloqueaMovimiento = false,
}) {
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();
  const { abrirPlantilla } = useAccionesJuego(); // ✅ Debe existir en tu EstadoJuego

  // ====== Refs para evitar closures inestables (y loops de update) ======
  const plantillaIdRef = useRef(plantillaId);
  const plantillaPropsRef = useRef(plantillaProps);

  useEffect(() => {
    plantillaIdRef.current = plantillaId;
  }, [plantillaId]);

  useEffect(() => {
    plantillaPropsRef.current = plantillaProps;
  }, [plantillaProps]);

  // Acción al interactuar: estable (NO cambia por props inline)
  const alInteractuar = useCallback(() => {
    const pid = plantillaIdRef.current;
    if (!pid) return;

    abrirPlantilla({
      id: pid,
      props: plantillaPropsRef.current ?? {},
      origenZonaId: id,
    });
  }, [abrirPlantilla, id]);

  // ====== Zona anclada a PIES (centro-bottom) ======
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

  // ====== Registrar zona de interacción indirecta ======
  useEffect(() => {
    if (!id) return;

    upsertCollider(id, rectRegistro, {
      id,
      categoria: "InteraccionIndirecta",
      tipo: "PersonajeTutorial",
      tecla,

      // ✅ NO bloquea la grilla A*
      bloqueaMovimiento: false,

      // metadata útil
      plantillaId,

      // acción (estable)
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
    plantillaId,
    alInteractuar,
    upsertCollider,
    removeCollider,
  ]);

  // ====== NPC visual ======
  const nid = useMemo(() => {
    const base = npcId || `${id}__npc`;
    return base === id ? `${id}__npc` : base; // evita pisar el id de la zona
  }, [npcId, id]);

  const npcW = Number(npcAncho);
  const npcH = Number(npcAlto);
  const renderNpc = !!npcImagen && Number.isFinite(npcW) && Number.isFinite(npcH);

  return (
    <>
      {/* ✅ Objeto visual del NPC (Decoration) */}
      {renderNpc && (
        <Objeto
          id={nid}
          categoria="Decoration"
          x={x}
          y={y}
          ancho={npcW}
          alto={npcH}
          imagen={npcImagen}
          colider={npcColider}
          bloqueaMovimiento={!!npcBloqueaMovimiento}
          mostrarDebug={mostrarDebug}
        />
      )}

      {/* ✅ Debug de la zona de interacción (naranja) */}
      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: rectRegistro.x,
            top: rectRegistro.y,
            width: rectRegistro.ancho,
            height: rectRegistro.alto,
            border: "2px dashed rgba(255, 165, 0, 0.95)",
            background: "rgba(255, 165, 0, 0.08)",
            pointerEvents: "none",
            zIndex: 999997,
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
