// src/juego/personajes/rival/Rival.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccionesRegistroColisiones } from "../../colisiones/RegistroColisiones.jsx";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import { selectorDeRival } from "../../../estado/selectorDeAspecto.jsx"; // ✅ mismo casing que el archivo real
import Objeto from "../../objetos/Objeto.jsx";

/**
 * Rival
 * - Interacción Indirecta (tecla) y/o Directa (al entrar)
 * - Directa tiene fallback local (por si tu motor NO llama callbacks tipo "alEntrar")
 * - Patrulla: rebote dentro de un rect (2D por defecto)
 *
 * ✅ NUEVO:
 * - Puede tomar imagen desde selectorDeRival(familia, tier, anim)
 * - Mantiene compatibilidad si pasas imagen/imagenDerrotado por props
 * - ✅ Inyecta familia a la plantilla: props.rivalFamilia
 */
export default function Rival({
  id,

  nombre = "",
  tier = 1,
  vidas = 1,
  escudos = 0,

  // ✅ familia para selector
  familia = "CALAVERA",

  x,
  y,

  // ✅ Compat: si viene imagen, se respeta
  imagen,
  imagenDerrotado = null,
  npcAncho = 128,
  npcAlto = 128,
  npcColider = null,
  colider = null,

  npcBloqueaMovimiento = true,

  tecla = "E",
  usarIndirecta = true,
  usarDirecta = undefined,

  indAncho = 120,
  indAlto = 120,
  indOffsetX = 0,
  indOffsetY = 0,
  indMargen = 0,

  dirAncho = 80,
  dirAlto = 80,
  dirOffsetX = 0,
  dirOffsetY = 0,
  dirMargen = 0,

  combatePlantillaId = "COMBATE_RIVAL",
  combateProps = {
    titulo: "COMBATE",
    texto: "El rival te desafía.",
    danioPerder: 1,
  },

  mostrarDebug = false,

  patrullaActiva = false,
  patrullaAncho = 0,
  patrullaAlto = 0,
  patrullaOffsetX = 0,
  patrullaOffsetY = 0,
  patrullaVelocidad = 30,
  patrullaPausaMs = 400,

  patrullaSoloHorizontal = false,
}) {
  const estado = useEstadoJuego();
  const { abrirPlantilla } = useAccionesJuego();
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();

  const debugActivo =
    typeof mostrarDebug === "boolean" ? mostrarDebug : !!estado.debug?.activo;

  const usarDirectaFinal =
    typeof usarDirecta === "boolean" ? usarDirecta : !usarIndirecta;

  const nombreFinal = useMemo(() => {
    const n = String(nombre ?? "").trim();
    return n ? n : String(id ?? "");
  }, [nombre, id]);

  const tierFinal = useMemo(() => {
    const t = Number(tier);
    if (!Number.isFinite(t)) return 1;
    return Math.min(3, Math.max(1, Math.round(t)));
  }, [tier]);

  const vidasFinal = useMemo(() => {
    const v = Math.floor(Number(vidas));
    if (!Number.isFinite(v)) return 1;
    return Math.max(0, v);
  }, [vidas]);

  const escudosFinal = useMemo(() => {
    const e = Math.floor(Number(escudos));
    if (!Number.isFinite(e)) return 0;
    return Math.max(0, e);
  }, [escudos]);

  const derrotado = !!estado.enemigos?.[id]?.derrotado;

  const plantillaIdRef = useRef(combatePlantillaId);
  const plantillaPropsRef = useRef(combateProps);

  useEffect(() => {
    plantillaIdRef.current = combatePlantillaId;
  }, [combatePlantillaId]);

  useEffect(() => {
    plantillaPropsRef.current = combateProps;
  }, [combateProps]);

  const [pos, setPos] = useState(() => ({
    x: Math.round(x || 0),
    y: Math.round(y || 0),
  }));

  useEffect(() => {
    setPos({ x: Math.round(x || 0), y: Math.round(y || 0) });
  }, [x, y]);

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

  const puntoEnRect = useCallback((px, py, r) => {
    if (!r) return false;
    return px >= r.x && px <= r.x + r.ancho && py >= r.y && py <= r.y + r.alto;
  }, []);

  const idIndirecta = `${id}__ind`;
  const idDirecta = `${id}__dir`;

  const abrirCombate = useCallback(
    (origenZonaId) => {
      const pid = plantillaIdRef.current;
      if (!pid) return;

      const baseProps = plantillaPropsRef.current ?? {};
      const propsFinales = {
        ...baseProps,

        // ✅ metadata del rival para UI
        rivalId: id,
        rivalNombre: nombreFinal,
        rivalFamilia: String(familia ?? "CALAVERA").toUpperCase().trim(), // ✅ clave para selector en combate
        rivalTier: tierFinal,
        rivalVidas: vidasFinal,
        rivalEscudos: escudosFinal,

        // compat
        familia: String(familia ?? "CALAVERA").toUpperCase().trim(),
        tier: tierFinal,
      };

      abrirPlantilla({ id: pid, props: propsFinales, origenZonaId });
    },
    [abrirPlantilla, id, nombreFinal, familia, tierFinal, vidasFinal, escudosFinal]
  );

  const lastTriggerRef = useRef(0);
  const triggerConCooldown = useCallback((fn, cooldownMs = 350) => {
    const now = Date.now();
    if (now - lastTriggerRef.current < cooldownMs) return;
    lastTriggerRef.current = now;
    fn?.();
  }, []);

  const rectIndBase = useMemo(
    () => rectDesdePies(pos.x, pos.y, indAncho, indAlto, indOffsetX, indOffsetY),
    [pos.x, pos.y, indAncho, indAlto, indOffsetX, indOffsetY, rectDesdePies]
  );
  const rectInd = useMemo(
    () => aplicarMargen(rectIndBase, indMargen),
    [rectIndBase, indMargen, aplicarMargen]
  );

  const rectDirBase = useMemo(
    () => rectDesdePies(pos.x, pos.y, dirAncho, dirAlto, dirOffsetX, dirOffsetY),
    [pos.x, pos.y, dirAncho, dirAlto, dirOffsetX, dirOffsetY, rectDesdePies]
  );
  const rectDir = useMemo(
    () => aplicarMargen(rectDirBase, dirMargen),
    [rectDirBase, dirMargen, aplicarMargen]
  );

  useEffect(() => {
    if (!id) return;

    if (derrotado) {
      removeCollider(idIndirecta);
      removeCollider(idDirecta);
      return;
    }

    // INDIRECTA
    if (usarIndirecta) {
      upsertCollider(idIndirecta, rectInd, {
        id: idIndirecta,
        categoria: "InteraccionIndirecta",
        tipo: "Rival",
        tecla,
        bloqueaMovimiento: false,

        rivalId: id,
        rivalNombre: nombreFinal,
        rivalFamilia: String(familia ?? "CALAVERA").toUpperCase().trim(),
        rivalTier: tierFinal,
        rivalVidas: vidasFinal,
        rivalEscudos: escudosFinal,

        alInteractuar: () => triggerConCooldown(() => abrirCombate(id), 300),
      });
    } else {
      removeCollider(idIndirecta);
    }

    // DIRECTA
    if (usarDirectaFinal) {
      const fnEnter = () => triggerConCooldown(() => abrirCombate(id), 400);

      upsertCollider(idDirecta, rectDir, {
        id: idDirecta,
        categoria: "InteraccionDirecta",
        tipo: "Rival",
        bloqueaMovimiento: false,

        rivalId: id,
        rivalNombre: nombreFinal,
        rivalFamilia: String(familia ?? "CALAVERA").toUpperCase().trim(),
        rivalTier: tierFinal,
        rivalVidas: vidasFinal,
        rivalEscudos: escudosFinal,

        alEntrar: fnEnter,
        onEnter: fnEnter,
        alEntrarZona: fnEnter,
        onOverlapStart: fnEnter,
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
    familia,
    derrotado,
    usarIndirecta,
    usarDirectaFinal,
    tecla,
    nombreFinal,
    tierFinal,
    vidasFinal,
    escudosFinal,
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

  // ✅ fallback directa: detectar entrada sin motor
  const estabaDentroDirRef = useRef(false);
  useEffect(() => {
    if (!usarDirectaFinal || derrotado) {
      estabaDentroDirRef.current = false;
      return;
    }

    const jx = Number(estado.jugador?.x);
    const jy = Number(estado.jugador?.y);
    if (!Number.isFinite(jx) || !Number.isFinite(jy)) return;

    const dentro = puntoEnRect(jx, jy, rectDir);
    if (dentro && !estabaDentroDirRef.current) {
      triggerConCooldown(() => abrirCombate(id), 400);
    }
    estabaDentroDirRef.current = dentro;
  }, [
    usarDirectaFinal,
    derrotado,
    estado.jugador?.x,
    estado.jugador?.y,
    rectDir.x,
    rectDir.y,
    rectDir.ancho,
    rectDir.alto,
    puntoEnRect,
    triggerConCooldown,
    abrirCombate,
    id,
  ]);

  // ===== Patrulla 2D =====
  const patrullaEnabled =
    !!patrullaActiva && Number(patrullaAncho) > 0 && Number(patrullaAlto) > 0;

  const anclaPatrullaRef = useRef({ x: Math.round(x || 0), y: Math.round(y || 0) });
  useEffect(() => {
    anclaPatrullaRef.current = { x: Math.round(x || 0), y: Math.round(y || 0) };
  }, [x, y]);

  const areaPatrulla = useMemo(() => {
    if (!patrullaEnabled) return null;

    const ax = anclaPatrullaRef.current.x;
    const ay = anclaPatrullaRef.current.y;

    const base = rectDesdePies(
      ax,
      ay,
      patrullaAncho,
      patrullaAlto,
      patrullaOffsetX,
      patrullaOffsetY
    );

    return {
      base,
      minX: base.x,
      maxX: base.x + base.ancho,
      minY: base.y,
      maxY: base.y + base.alto,
    };
  }, [
    patrullaEnabled,
    patrullaAncho,
    patrullaAlto,
    patrullaOffsetX,
    patrullaOffsetY,
    rectDesdePies,
  ]);

  const velRef = useRef({ vx: 1, vy: 0 });
  const pausaHastaRef = useRef(0);
  const rafRef = useRef(null);
  const lastTRef = useRef(0);

  const pickDir = useCallback(() => {
    if (patrullaSoloHorizontal) {
      velRef.current = { vx: Math.random() < 0.5 ? 1 : -1, vy: 0 };
      return;
    }

    let vx = 1,
      vy = 1;
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      vx = Math.cos(ang);
      vy = Math.sin(ang);
      if (Math.abs(vy) >= 0.35 && Math.abs(vx) >= 0.25) break;
    }

    const len = Math.hypot(vx, vy) || 1;
    velRef.current = { vx: vx / len, vy: vy / len };
  }, [patrullaSoloHorizontal]);

  useEffect(() => {
    if (!patrullaEnabled || derrotado) return;

    pickDir();
    pausaHastaRef.current = 0;
    lastTRef.current = performance.now();

    const loop = (t) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.max(0, (t - lastTRef.current) / 1000);
      lastTRef.current = t;

      if (pausaHastaRef.current && t < pausaHastaRef.current) return;

      const speed = Math.max(5, Number(patrullaVelocidad || 30));

      setPos((p) => {
        if (!areaPatrulla) return p;

        let nx = p.x + velRef.current.vx * speed * dt;
        let ny = p.y + velRef.current.vy * speed * dt;

        let hitX = false;
        let hitY = false;

        if (nx < areaPatrulla.minX) {
          nx = areaPatrulla.minX;
          hitX = true;
        } else if (nx > areaPatrulla.maxX) {
          nx = areaPatrulla.maxX;
          hitX = true;
        }

        if (ny < areaPatrulla.minY) {
          ny = areaPatrulla.minY;
          hitY = true;
        } else if (ny > areaPatrulla.maxY) {
          ny = areaPatrulla.maxY;
          hitY = true;
        }

        if (hitX || hitY) {
          if (hitX) velRef.current = { ...velRef.current, vx: -velRef.current.vx };
          if (hitY && !patrullaSoloHorizontal)
            velRef.current = { ...velRef.current, vy: -velRef.current.vy };

          const pausa = Math.max(0, Number(patrullaPausaMs || 0));
          if (pausa) pausaHastaRef.current = t + pausa;
        }

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
  }, [
    patrullaEnabled,
    derrotado,
    areaPatrulla,
    patrullaVelocidad,
    patrullaPausaMs,
    pickDir,
    patrullaSoloHorizontal,
  ]);

  // ===== Imagen (compat + selector) =====
  const srcNormal = useMemo(() => {
    // tu webp actual es caminando, lo tratamos como "idle"
    return imagen || selectorDeRival(familia, tierFinal, "idle") || null;
  }, [imagen, familia, tierFinal]);

  const srcDerrotado = useMemo(() => {
    return imagenDerrotado || selectorDeRival(familia, tierFinal, "derrotado") || null;
  }, [imagenDerrotado, familia, tierFinal]);

  const src = derrotado ? (srcDerrotado || srcNormal) : srcNormal;

  const npcW = Number(npcAncho);
  const npcH = Number(npcAlto);
  const renderNpc = !!src && Number.isFinite(npcW) && Number.isFinite(npcH);

  const nid = useMemo(() => `${id}__npc`, [id]);

  const debugLabel = useMemo(() => {
    if (!debugActivo) return null;
    const base = `${nombreFinal || id} | ${String(familia).toUpperCase()} | TIER ${tierFinal} | V:${vidasFinal} | E:${escudosFinal}`;
    return derrotado ? `${base} (DERROTADO)` : base;
  }, [debugActivo, nombreFinal, id, familia, tierFinal, vidasFinal, escudosFinal, derrotado]);

  return (
    <>
      {renderNpc && (
        <>
          <Objeto
            id={nid}
            categoria="Decoration"
            x={pos.x}
            y={pos.y}
            ancho={npcW}
            alto={npcH}
            imagen={src}
            colider={npcColider ?? colider}
            bloqueaMovimiento={false}
            mostrarDebug={debugActivo}
          />

          {debugActivo && (
            <div
              style={{
                position: "absolute",
                left: Math.round(pos.x - 140),
                top: Math.round(pos.y - npcH - 26),
                width: 280,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.65)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white",
                zIndex: 999997,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {debugLabel}
            </div>
          )}
        </>
      )}

      {/* DEBUG: zona INDIRECTA */}
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

      {/* DEBUG: zona DIRECTA */}
      {debugActivo && usarDirectaFinal && !derrotado && (
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

      {/* DEBUG: área patrulla */}
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
