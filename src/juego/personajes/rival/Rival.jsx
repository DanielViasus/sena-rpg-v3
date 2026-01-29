// src/juego/personajes/rival/Rival.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccionesRegistroColisiones } from "../../colisiones/RegistroColisiones.jsx";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import Objeto from "../../objetos/Objeto.jsx";

/**
 * Rival
 * - Puede registrar 2 zonas:
 *   1) Interacción Indirecta: requiere tecla (por defecto "E")
 *   2) Interacción Directa: abre combate al entrar a la zona (sin tecla)
 *
 * - Al ganar: el CombatePromptRival llama derrotarEnemigo(origenZonaId)
 *   y este Rival queda deshabilitado + cambia imagen.
 *
 * - Patrulla: movimiento simple dentro de un rect (clamp). No hace pathfinding.
 */
export default function Rival({
  // ===== Identidad (obligatorio) =====
  id,

  // ===== Posición PIES (centro-bottom) =====
  x,
  y,

  // ===== Visual (NPC / Objeto) =====
  imagen,
  imagenDerrotado = null,
  npcAncho = 128,
  npcAlto = 128,
  npcColider = null, // collider del Objeto (centro-bottom), opcional
  npcBloqueaMovimiento = true,

  // ===== Modo interacción =====
  usarIndirecta = true,
  usarDirecta = false,
  tecla = "E",

  // ===== Zona INDIRECTA (rect anclado a pies) =====
  indAncho = 120,
  indAlto = 120,
  indOffsetX = 0,
  indOffsetY = 0,
  indMargen = 0,

  // ===== Zona DIRECTA (rect anclado a pies) =====
  dirAncho = 80,
  dirAlto = 80,
  dirOffsetX = 0,
  dirOffsetY = 0,
  dirMargen = 0,

  // ===== Plantilla combate =====
  combatePlantillaId = "COMBATE_RIVAL",
  combateProps = {
    titulo: "COMBATE",
    texto: "El rival te desafía.",
    danioPerder: 1,
  },

  // ===== Debug =====
  mostrarDebug = false,

  // ===== Patrulla (opcional) =====
  patrullaActiva = false,
  patrullaAncho = 0, // si > 0 y patrullaActiva=true => se mueve
  patrullaAlto = 0,
  patrullaOffsetX = 0,
  patrullaOffsetY = 0,
  patrullaVelocidad = 30, // px/seg (suave)
  patrullaPausaMs = 400, // pausa al tocar borde
}) {
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();
  const estado = useEstadoJuego();
  const { abrirPlantilla } = useAccionesJuego();

  const debugActivo = typeof mostrarDebug === "boolean" ? mostrarDebug : !!estado.debug?.activo;

  // ===== Derrotado (estado global) =====
  const derrotado = !!estado.enemigos?.[id]?.derrotado;

  // ===== Refs para evitar cierres inestables / loops =====
  const plantillaIdRef = useRef(combatePlantillaId);
  const plantillaPropsRef = useRef(combateProps);

  useEffect(() => {
    plantillaIdRef.current = combatePlantillaId;
  }, [combatePlantillaId]);

  useEffect(() => {
    plantillaPropsRef.current = combateProps;
  }, [combateProps]);

  // ===== Posición actual del rival (para patrulla) =====
  const [pos, setPos] = useState(() => ({
    x: Math.round(x || 0),
    y: Math.round(y || 0),
  }));

  // Si props x/y cambian desde el padre, sincronizamos
  useEffect(() => {
    setPos({ x: Math.round(x || 0), y: Math.round(y || 0) });
  }, [x, y]);

  // ===== Helpers rect anclado a PIES =====
  const rectDesdePies = useCallback((piesX, piesY, ancho, alto, ox = 0, oy = 0) => {
    const anclaX = Math.round(piesX + (ox ?? 0));
    const anclaY = Math.round(piesY + (oy ?? 0));
    const left = Math.round(anclaX - ancho / 2);
    const top = Math.round(anclaY - alto);
    return { x: left, y: top, ancho: Math.round(ancho), alto: Math.round(alto) };
  }, []);

  const aplicarMargen = useCallback((rect, margen) => {
    const m = Math.max(0, Number(margen || 0));
    if (!m) return rect;
    return {
      x: rect.x - m,
      y: rect.y - m,
      ancho: rect.ancho + m * 2,
      alto: rect.alto + m * 2,
    };
  }, []);

  // ===== IDs internos para colliders =====
  const idIndirecta = `${id}__ind`;
  const idDirecta = `${id}__dir`;

  // ===== Acción combate (estable) =====
  const abrirCombate = useCallback(
    (origenZonaId) => {
      const pid = plantillaIdRef.current;
      if (!pid) return;

      abrirPlantilla({
        id: pid,
        props: plantillaPropsRef.current ?? {},
        origenZonaId, // ✅ importante para derrotar este rival
      });
    },
    [abrirPlantilla]
  );

  // ===== Cooldown para evitar doble trigger por frames/entradas =====
  const lastTriggerRef = useRef(0);
  const triggerConCooldown = useCallback(
    (fn, cooldownMs = 350) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < cooldownMs) return;
      lastTriggerRef.current = now;
      fn?.();
    },
    []
  );

  // ===== Rects de interacción =====
  const rectIndBase = useMemo(() => {
    return rectDesdePies(pos.x, pos.y, indAncho, indAlto, indOffsetX, indOffsetY);
  }, [pos.x, pos.y, indAncho, indAlto, indOffsetX, indOffsetY, rectDesdePies]);

  const rectInd = useMemo(() => aplicarMargen(rectIndBase, indMargen), [rectIndBase, indMargen, aplicarMargen]);

  const rectDirBase = useMemo(() => {
    return rectDesdePies(pos.x, pos.y, dirAncho, dirAlto, dirOffsetX, dirOffsetY);
  }, [pos.x, pos.y, dirAncho, dirAlto, dirOffsetX, dirOffsetY, rectDesdePies]);

  const rectDir = useMemo(() => aplicarMargen(rectDirBase, dirMargen), [rectDirBase, dirMargen, aplicarMargen]);

  // ===== Registrar colliders (IND / DIR) =====
  useEffect(() => {
    if (!id) return;

    // Si está derrotado: remover todo y no registrar
    if (derrotado) {
      removeCollider(idIndirecta);
      removeCollider(idDirecta);
      return;
    }

    // INDIRECTA (tecla)
    if (usarIndirecta) {
      upsertCollider(idIndirecta, rectInd, {
        id: idIndirecta,
        categoria: "InteraccionIndirecta",
        tipo: "Rival",
        tecla,
        bloqueaMovimiento: false,
        rivalId: id,

        // ✅ callback estable (para tu sistema de interacción por tecla)
        alInteractuar: () => triggerConCooldown(() => abrirCombate(id), 300),
      });
    } else {
      removeCollider(idIndirecta);
    }

    // DIRECTA (al entrar)
    if (usarDirecta) {
      upsertCollider(idDirecta, rectDir, {
        id: idDirecta,
        categoria: "InteraccionDirecta",
        tipo: "Rival",
        bloqueaMovimiento: false,
        rivalId: id,

        /**
         * ✅ IMPORTANTÍSIMO:
         * Tu motor de colisiones debe llamar este callback cuando el jugador ENTRA a la zona.
         * Si tu sistema usa otro nombre (onEnter / alEntrarZona / etc.), lo cambiamos.
         */
        alEntrar: () => triggerConCooldown(() => abrirCombate(id), 400),
      });
    } else {
      removeCollider(idDirecta);
    }

    return () => {
      removeCollider(idIndirecta);
      removeCollider(idDirecta);
    };
  }, [
    id,
    derrotado,

    usarIndirecta,
    usarDirecta,
    tecla,

    rectInd.x,
    rectInd.y,
    rectInd.ancho,
    rectInd.alto,

    rectDir.x,
    rectDir.y,
    rectDir.ancho,
    rectDir.alto,

    upsertCollider,
    removeCollider,
    abrirCombate,
    triggerConCooldown,
  ]);

  // ===== Patrulla simple (opcional) =====
  const patrullaEnabled = !!patrullaActiva && Number(patrullaAncho) > 0 && Number(patrullaAlto) > 0;

  const areaPatrulla = useMemo(() => {
    if (!patrullaEnabled) return null;
    const base = rectDesdePies(pos.x, pos.y, patrullaAncho, patrullaAlto, patrullaOffsetX, patrullaOffsetY);
    // Área patrulla la interpretamos como rect donde el "pies" puede moverse dentro.
    // Convertimos a límites de pies (x,y): [minX..maxX], [minY..maxY]
    const minX = base.x;
    const maxX = base.x + base.ancho;
    const minY = base.y;
    const maxY = base.y + base.alto;
    return { base, minX, maxX, minY, maxY };
  }, [
    patrullaEnabled,
    patrullaAncho,
    patrullaAlto,
    patrullaOffsetX,
    patrullaOffsetY,
    pos.x,
    pos.y,
    rectDesdePies,
  ]);

  const velRef = useRef({ vx: 1, vy: 0 }); // dirección
  const pausaHastaRef = useRef(0);
  const rafRef = useRef(null);
  const lastTRef = useRef(0);

  useEffect(() => {
    if (!patrullaEnabled || derrotado) return;

    // Semilla de dirección inicial (alternar un poco para que no sea siempre igual)
    velRef.current = { vx: 1, vy: 0 };
    pausaHastaRef.current = 0;
    lastTRef.current = performance.now();

    const loop = (t) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.max(0, (t - lastTRef.current) / 1000);
      lastTRef.current = t;

      // pausa
      if (pausaHastaRef.current && t < pausaHastaRef.current) return;

      const speed = Math.max(5, Number(patrullaVelocidad || 30)); // px/s

      setPos((p) => {
        if (!areaPatrulla) return p;

        let nx = p.x + velRef.current.vx * speed * dt;
        let ny = p.y + velRef.current.vy * speed * dt;

        let hit = false;

        // clamp X
        if (nx < areaPatrulla.minX) {
          nx = areaPatrulla.minX;
          hit = true;
        } else if (nx > areaPatrulla.maxX) {
          nx = areaPatrulla.maxX;
          hit = true;
        }

        // clamp Y
        if (ny < areaPatrulla.minY) {
          ny = areaPatrulla.minY;
          hit = true;
        } else if (ny > areaPatrulla.maxY) {
          ny = areaPatrulla.maxY;
          hit = true;
        }

        // si toca borde, cambia dirección simple (ping-pong)
        if (hit) {
          // invierte componente principal
          if (velRef.current.vx !== 0) velRef.current = { vx: -velRef.current.vx, vy: 0 };
          else velRef.current = { vx: 1, vy: 0 };

          const pausa = Math.max(0, Number(patrullaPausaMs || 0));
          if (pausa) pausaHastaRef.current = t + pausa;
        }

        // evita renders si no cambió
        nx = Math.round(nx);
        ny = Math.round(ny);
        if (nx === p.x && ny === p.y) return p;
        return { x: nx, y: ny };
      });
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [patrullaEnabled, derrotado, areaPatrulla, patrullaVelocidad, patrullaPausaMs]);

  // ===== Render =====
  const src = derrotado && imagenDerrotado ? imagenDerrotado : imagen;

  const npcW = Number(npcAncho);
  const npcH = Number(npcAlto);
  const renderNpc = !!src && Number.isFinite(npcW) && Number.isFinite(npcH);

  // Id del objeto visual
  const nid = useMemo(() => {
    const base = `${id}__npc`;
    return base;
  }, [id]);

  return (
    <>
      {renderNpc && (
        <Objeto
          id={nid}
          categoria="Rival"
          x={pos.x}
          y={pos.y}
          ancho={npcW}
          alto={npcH}
          imagen={src}
          colider={npcColider}
          // Si está derrotado => que no bloquee, para no estorbar
          bloqueaMovimiento={derrotado ? false : !!npcBloqueaMovimiento}
          mostrarDebug={debugActivo}
        />
      )}

      {/* ===== DEBUG: zona INDIRECTA (amarillo) ===== */}
      {debugActivo && usarIndirecta && !derrotado && (
        <div
          style={{
            position: "absolute",
            left: rectInd.x,
            top: rectInd.y,
            width: rectInd.ancho,
            height: rectInd.alto,
            border: "2px dashed rgba(255, 255, 0, 0.95)",
            background: "rgba(255, 255, 0, 0.08)",
            pointerEvents: "none",
            zIndex: 999996,
            boxSizing: "border-box",
          }}
        />
      )}

      {/* ===== DEBUG: zona DIRECTA (cian) ===== */}
      {debugActivo && usarDirecta && !derrotado && (
        <div
          style={{
            position: "absolute",
            left: rectDir.x,
            top: rectDir.y,
            width: rectDir.ancho,
            height: rectDir.alto,
            border: "2px dashed rgba(0, 255, 255, 0.95)",
            background: "rgba(0, 255, 255, 0.08)",
            pointerEvents: "none",
            zIndex: 999996,
            boxSizing: "border-box",
          }}
        />
      )}

      {/* ===== DEBUG: área patrulla (magenta) ===== */}
      {debugActivo && areaPatrulla?.base && !derrotado && (
        <div
          style={{
            position: "absolute",
            left: areaPatrulla.base.x,
            top: areaPatrulla.base.y,
            width: areaPatrulla.base.ancho,
            height: areaPatrulla.base.alto,
            border: "2px dashed rgba(255, 0, 255, 0.95)",
            background: "rgba(255, 0, 255, 0.06)",
            pointerEvents: "none",
            zIndex: 999995,
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
