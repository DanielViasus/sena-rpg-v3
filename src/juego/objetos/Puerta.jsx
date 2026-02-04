// src/juego/objetos/Puerta.jsx
import React, { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useAccionesRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";

// ✅ SFX (AJUSTA SI TU RUTA REAL DIFERIE)
import openDoorSfx from "../../assets/sonidos/objetos/door/openDoor.mp3";
import lockDoorSfx from "../../assets/sonidos/objetos/door/lockDoor.mp3";

// ✅ Imagen “flash” cuando está bloqueada (AJUSTA SI TU RUTA REAL DIFERIE)
import puertaBloqueadaImg from "../../assets/svg/objetos/Puertas/puertaBloqueada.svg";

/**
 * Puerta
 * - Visual: imagenCerrada / imagenAbierta
 * - Collider físico (bloquea) configurable por props (igual que Objeto)
 * - Collider de interacción indirecta (NO bloquea) para accionar con tecla (E)
 * - Sonidos:
 *   - openDoor.mp3: al abrir/cerrar (solo si la acción es válida)
 *   - lockDoor.mp3: si está bloqueada (requisitoHabilitado=true) y se intenta accionar
 * - Flash visual:
 *   - si bloqueada: cambia imagen 100ms a puertaBloqueada.svg y vuelve
 *
 * x,y ANCLADOS A PIES (centro-bottom)
 */
export default function Puerta({
  // ---- props estándar tipo Objeto ----
  id,
  categoria = "Pared",
  x,
  y,
  ancho,
  alto,

  // compatibilidad
  imagen = null,

  /**
   * ✅ Collider físico (bloqueo) configurable (como Objeto)
   * { ancho, alto, offsetX, offsetY } anclado a centro-bottom (x,y)
   * Si no lo pasas, por defecto usa TODO el sprite.
   */
  colider = null,

  margenZona = 0,
  bloqueaMovimiento,
  mostrarDebug = false,

  // ---- estado/visual puerta ----
  abierta, // controlado opcional
  abiertaInicial = false,
  onCambioAbierta,

  requisitoHabilitado = false, // si true => bloqueada

  imagenCerrada = null,
  imagenAbierta = null,

  /**
   * Si quieres un collider distinto SOLO cuando está cerrada.
   * Si no lo pasas, usa "colider".
   */
  coliderCerrada = null,

  // debug opcional para probar con click
  debugClickAccionar = false,

  // ---- interacción indirecta ----
  usarInteraccionIndirecta = true,
  tecla = "E",

  /**
   * Zona de interacción (rect) anclada a pies (x,y)
   * Si no pasas intAncho/intAlto, usa ancho/alto de la puerta.
   * Recomendación: hazla MÁS GRANDE que el collider físico.
   */
  intAncho = null,
  intAlto = null,
  intOffsetX = 0,
  intOffsetY = 0,
  intMargenZona = 0,
  interaccionId = null,

  // callback opcional adicional
  onInteractuar,

  // ---- sonido ----
  reproducirSonido = true,
  volumenSonido = 0.8,

  // ---- flash bloqueada ----
  imagenBloqueada = puertaBloqueadaImg, // ✅ puedes override por props si quieres
  flashBloqueadaMs = 100,
}) {
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();

  // ---------------------------
  // Estado abierta (controlado vs interno)
  // ---------------------------
  const esControlada = typeof abierta === "boolean";
  const [abiertaLocal, setAbiertaLocal] = useState(Boolean(abiertaInicial));
  const abiertaFinal = esControlada ? abierta : abiertaLocal;

  const setAbiertaFinal = useCallback(
    (nuevoValor) => {
      if (!esControlada) setAbiertaLocal(nuevoValor);
      if (typeof onCambioAbierta === "function") onCambioAbierta(nuevoValor);
    },
    [esControlada, onCambioAbierta]
  );

  // ---------------------------
  // Flash cuando está bloqueada
  // ---------------------------
  const [flashBloqueada, setFlashBloqueada] = useState(false);
  const flashTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    };
  }, []);

  const dispararFlashBloqueada = useCallback(() => {
    if (!imagenBloqueada) return;

    setFlashBloqueada(true);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setFlashBloqueada(false);
      flashTimerRef.current = null;
    }, Math.max(0, Number(flashBloqueadaMs ?? 100)));
  }, [imagenBloqueada, flashBloqueadaMs]);

  // ---------------------------
  // Audio (una sola instancia por componente)
  // ---------------------------
  const audioOpen = useMemo(() => {
    try {
      return new Audio(openDoorSfx);
    } catch {
      return null;
    }
  }, []);

  const audioLock = useMemo(() => {
    try {
      return new Audio(lockDoorSfx);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const v = Math.max(0, Math.min(1, volumenSonido ?? 0.8));
    if (audioOpen) {
      audioOpen.preload = "auto";
      audioOpen.volume = v;
    }
    if (audioLock) {
      audioLock.preload = "auto";
      audioLock.volume = v;
    }
  }, [audioOpen, audioLock, volumenSonido]);

  const playOnce = useCallback(
    (a) => {
      if (!reproducirSonido || !a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
    },
    [reproducirSonido]
  );

  // ---------------------------
  // Sprite rect (mundo): x,y anclados a PIES
  // ---------------------------
  const sprite = useMemo(() => {
    const left = Math.round(x - ancho / 2);
    const top = Math.round(y - alto);
    return { left, top, ancho, alto };
  }, [x, y, ancho, alto]);

  // ---------------------------
  // Bloqueo: default true como Objeto
  // ---------------------------
  const bloqueaBase = useMemo(() => {
    if (typeof bloqueaMovimiento === "boolean") return bloqueaMovimiento;
    return true;
  }, [bloqueaMovimiento]);

  // ---------------------------
  // Collider físico base cuando está CERRADA
  // ---------------------------
  const coliderBaseCerrada = useMemo(() => {
    if (coliderCerrada) return coliderCerrada;
    return colider;
  }, [coliderCerrada, colider]);

  // ---------------------------
  // Collider físico cuando está ABIERTA:
  // - ancho=1
  // - left = sprite.left + 1
  // ---------------------------
  const coliderAbierta = useMemo(() => {
    const altoBase = coliderBaseCerrada?.alto ?? sprite.alto;
    const offsetYBase = coliderBaseCerrada?.offsetY ?? 0;

    const leftObjetivo = Math.round(sprite.left + 1);
    const anclaX = leftObjetivo + 0.5; // ancho/2 (1/2)
    const offsetX = anclaX - x;

    return {
      ancho: 1,
      alto: altoBase,
      offsetX,
      offsetY: offsetYBase,
    };
  }, [coliderBaseCerrada, sprite.left, sprite.alto, x]);

  const coliderActivo = useMemo(() => {
    return abiertaFinal ? coliderAbierta : coliderBaseCerrada;
  }, [abiertaFinal, coliderAbierta, coliderBaseCerrada]);

  // ---------------------------
  // Rect base del collider físico (mundo) — igual que Objeto
  // ---------------------------
  const rectBaseFisico = useMemo(() => {
    if (!coliderActivo) {
      return {
        x: sprite.left,
        y: sprite.top,
        ancho: sprite.ancho,
        alto: sprite.alto,
      };
    }

    const offsetX = coliderActivo.offsetX ?? 0;
    const offsetY = coliderActivo.offsetY ?? 0;

    const anclaX = Math.round(x + offsetX);
    const anclaY = Math.round(y + offsetY);

    const left = Math.round(anclaX - coliderActivo.ancho / 2);
    const top = Math.round(anclaY - coliderActivo.alto);

    return {
      x: left,
      y: top,
      ancho: coliderActivo.ancho,
      alto: coliderActivo.alto,
    };
  }, [coliderActivo, sprite.left, sprite.top, sprite.ancho, sprite.alto, x, y]);

  const rectRegistroFisico = useMemo(() => {
    const m = Math.max(0, margenZona || 0);
    return {
      x: rectBaseFisico.x - m,
      y: rectBaseFisico.y - m,
      ancho: rectBaseFisico.ancho + m * 2,
      alto: rectBaseFisico.alto + m * 2,
    };
  }, [rectBaseFisico, margenZona]);

  // zIndex igual que Objeto (mitad del collider)
  const zIndex = useMemo(() => {
    const refY = rectBaseFisico.y + rectBaseFisico.alto / 2;
    return Math.max(10, Math.round(refY));
  }, [rectBaseFisico.y, rectBaseFisico.alto]);

  // Color debug por categoría
  const colorCollider = useMemo(() => {
    const c = String(categoria || "").toLowerCase();
    if (c === "pared") return "rgba(255, 0, 0, 0.85)";
    if (c === "decoration" || c === "decoracion") return "rgba(0, 160, 255, 0.85)";
    return "rgba(0, 255, 0, 0.85)";
  }, [categoria]);

  // Bloquea cuando está cerrada
  const bloqueaPuerta = useMemo(() => {
    return bloqueaBase && !abiertaFinal;
  }, [bloqueaBase, abiertaFinal]);

  // ---------------------------
  // Registrar collider físico (obstáculo)
  // ---------------------------
  useEffect(() => {
    if (!id) return;

    upsertCollider(id, rectRegistroFisico, {
      id,
      categoria,
      bloqueaMovimiento: bloqueaPuerta,
    });

    return () => removeCollider(id);
  }, [
    id,
    rectRegistroFisico.x,
    rectRegistroFisico.y,
    rectRegistroFisico.ancho,
    rectRegistroFisico.alto,
    categoria,
    bloqueaPuerta,
    upsertCollider,
    removeCollider,
  ]);

  // ---------------------------
  // Imagen por estado + flash bloqueada
  // ---------------------------
  const imagenActual = useMemo(() => {
    // ✅ flash solo cuando está bloqueada y se intenta accionar
    if (flashBloqueada && !abiertaFinal) return imagenBloqueada;

    if (abiertaFinal) return imagenAbierta ?? imagen;
    return imagenCerrada ?? imagen;
  }, [flashBloqueada, abiertaFinal, imagenBloqueada, imagenAbierta, imagenCerrada, imagen]);

  const RenderImagen = () => {
    if (!imagenActual) return null;

    if (typeof imagenActual === "string") {
      return (
        <img
          src={imagenActual}
          alt={id}
          style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
          draggable={false}
        />
      );
    }

    const ImgComp = imagenActual;
    return (
      <div style={{ width: "100%", height: "100%", display: "block" }}>
        <ImgComp width="100%" height="100%" />
      </div>
    );
  };

  // ---------------------------
  // Accionar (indirecta)
  // - bloqueada => lock + flash 100ms
  // - valida => alterna + open
  // ---------------------------
  const accionar = useCallback(() => {
    if (typeof onInteractuar === "function") onInteractuar();

    if (requisitoHabilitado) {
      playOnce(audioLock);
      dispararFlashBloqueada();
      return;
    }

    playOnce(audioOpen);
    setAbiertaFinal(!abiertaFinal);
  }, [
    onInteractuar,
    requisitoHabilitado,
    playOnce,
    audioLock,
    audioOpen,
    dispararFlashBloqueada,
    setAbiertaFinal,
    abiertaFinal,
  ]);

  // ---------------------------
  // Zona de interacción indirecta (similar a Teleport)
  // ---------------------------
  const zonaAncho = Number.isFinite(intAncho) ? intAncho : ancho;
  const zonaAlto = Number.isFinite(intAlto) ? intAlto : alto;
  const zid = interaccionId || (id ? `${id}__int` : null);

  const rectBaseInteraccion = useMemo(() => {
    const anclaX = Math.round(x + (intOffsetX ?? 0));
    const anclaY = Math.round(y + (intOffsetY ?? 0));

    const left = Math.round(anclaX - zonaAncho / 2);
    const top = Math.round(anclaY - zonaAlto);

    return {
      x: left,
      y: top,
      ancho: Math.round(zonaAncho),
      alto: Math.round(zonaAlto),
    };
  }, [x, y, zonaAncho, zonaAlto, intOffsetX, intOffsetY]);

  const rectRegistroInteraccion = useMemo(() => {
    const m = Math.max(0, intMargenZona || 0);
    return {
      x: rectBaseInteraccion.x - m,
      y: rectBaseInteraccion.y - m,
      ancho: rectBaseInteraccion.ancho + m * 2,
      alto: rectBaseInteraccion.alto + m * 2,
    };
  }, [rectBaseInteraccion, intMargenZona]);

  useEffect(() => {
    if (!usarInteraccionIndirecta) return;
    if (!zid) return;

    upsertCollider(zid, rectRegistroInteraccion, {
      id: zid,
      categoria: "InteraccionIndirecta",
      tipo: "Puerta",
      tecla,
      bloqueaMovimiento: false,

      puertaId: id,
      puertaAbierta: abiertaFinal,
      requisitoHabilitado,

      alInteractuar: accionar,
    });

    return () => removeCollider(zid);
  }, [
    usarInteraccionIndirecta,
    zid,
    rectRegistroInteraccion.x,
    rectRegistroInteraccion.y,
    rectRegistroInteraccion.ancho,
    rectRegistroInteraccion.alto,
    tecla,
    id,
    abiertaFinal,
    requisitoHabilitado,
    accionar,
    upsertCollider,
    removeCollider,
  ]);

  // Click para pruebas (solo debug)
  const pointerEvents = mostrarDebug && debugClickAccionar ? "auto" : "none";

  return (
    <>
      {/* Sprite (visual) */}
      <div
        onClick={() => {
          if (mostrarDebug && debugClickAccionar) accionar();
        }}
        style={{
          position: "absolute",
          left: sprite.left,
          top: sprite.top,
          width: sprite.ancho,
          height: sprite.alto,
          zIndex,
          pointerEvents,
          cursor: mostrarDebug && debugClickAccionar ? "pointer" : "default",
        }}
        title={mostrarDebug && debugClickAccionar ? "Click para accionar (debug)" : undefined}
      >
        {mostrarDebug && (
          <>
            <p style={{ position: "absolute", left: "8%", top: "6%", fontSize: 12, margin: 0 }}>
              {id}
            </p>
            <p style={{ position: "absolute", left: "8%", bottom: "6%", fontSize: 12, margin: 0 }}>
              {abiertaFinal ? "ABIERTA" : "CERRADA"}
              {requisitoHabilitado ? " (LOCK)" : " (OK)"}
            </p>
          </>
        )}

        <RenderImagen />

        {mostrarDebug && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              border: "1px dashed rgba(200,200,200,0.9)",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>

      {/* Debug: collider físico */}
      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: rectRegistroFisico.x,
            top: rectRegistroFisico.y,
            width: rectRegistroFisico.ancho,
            height: rectRegistroFisico.alto,
            border: `2px solid ${colorCollider}`,
            background: colorCollider.replace("0.85", "0.10"),
            zIndex: zIndex + 9999,
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Debug: zona interacción (amarillo) */}
      {mostrarDebug && usarInteraccionIndirecta && zid && (
        <div
          style={{
            position: "absolute",
            left: rectRegistroInteraccion.x,
            top: rectRegistroInteraccion.y,
            width: rectRegistroInteraccion.ancho,
            height: rectRegistroInteraccion.alto,
            border: "2px dashed rgba(255, 215, 0, 0.95)",
            background: "rgba(255, 215, 0, 0.08)",
            pointerEvents: "none",
            zIndex: zIndex + 9997,
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
