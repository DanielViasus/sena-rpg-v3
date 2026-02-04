import React, { useEffect, useMemo } from "react";
import { useAccionesRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";

/**
 * Objeto
 * - x,y ANCLADOS A PIES (centro-bottom)
 * - Imagen: URL (string) o Componente SVG (SVGR)
 * - Registra colisión en RegistroColisiones
 *
 * IMPORTANTE (cambio):
 * - El colider ahora se ANCLA desde el CENTRO-BOTTOM del objeto (x,y),
 *   NO desde el top-left del sprite.
 *   offsetX/offsetY se aplican desde ese centro-bottom.
 */
export default function Objeto({
  id,
  categoria = "Pared",
  x,
  y,
  ancho,
  alto,
  imagen,

  /**
   * Collider del objeto (pared/obstáculo)
   * Ahora: anclado desde CENTRO-BOTTOM (x,y)
   * - ancho, alto
   * - offsetX: mueve el ancla en X (desde el centro)
   * - offsetY: mueve el ancla en Y (desde los pies). Positivo = más abajo.
   */
  colider = null,

  /**
   * Expande el rect registrado (si lo necesitas para tolerancias)
   * No es para interacción por ahora; solo “engorda” el rect.
   */
  margenZona = 0,

  /**
   * Si es false, NO alimenta la grilla A* como obstáculo (no bloquea)
   * Default: true
   */
  bloqueaMovimiento,

  // Debug
  mostrarDebug = false,
}) {
  const { upsertCollider, removeCollider } = useAccionesRegistroColisiones();

  // Sprite rect (mundo): como x,y van a PIES => top = y - alto, left = x - ancho/2
  const sprite = useMemo(() => {
    const left = Math.round(x - ancho / 2);
    const top = Math.round(y - alto);
    return { left, top, ancho, alto };
  }, [x, y, ancho, alto]);

  /**
   * Rect base de colisión (mundo)
   * - Si NO hay colider, usa el sprite completo.
   * - Si hay colider, se calcula desde el CENTRO-BOTTOM (x,y):
   *    ancla = (x + offsetX, y + offsetY)
   *    left  = anclaX - colider.ancho/2
   *    top   = anclaY - colider.alto
   */
  const rectBase = useMemo(() => {
    // sin colider: todo el sprite
    if (!colider) {
      return {
        x: sprite.left,
        y: sprite.top,
        ancho: sprite.ancho,
        alto: sprite.alto,
      };
    }

    const offsetX = colider.offsetX ?? 0;
    const offsetY = colider.offsetY ?? 0;

    const anclaX = Math.round(x + offsetX); // centro-bottom X
    const anclaY = Math.round(y + offsetY); // bottom Y (pies)

    const left = Math.round(anclaX - colider.ancho / 2);
    const top = Math.round(anclaY - colider.alto);

    return {
      x: left,
      y: top,
      ancho: colider.ancho,
      alto: colider.alto,
    };
  }, [colider, sprite.left, sprite.top, sprite.ancho, sprite.alto, x, y]);

  // Rect registrado (si margenZona > 0, se expande)
  const rectRegistro = useMemo(() => {
    const m = Math.max(0, margenZona || 0);
    return {
      x: rectBase.x - m,
      y: rectBase.y - m,
      ancho: rectBase.ancho + m * 2,
      alto: rectBase.alto + m * 2,
    };
  }, [rectBase, margenZona]);

  // Default de bloqueo: true (Decoration también puede bloquear si tiene colider)
  const bloquea = useMemo(() => {
    if (typeof bloqueaMovimiento === "boolean") return bloqueaMovimiento;
    return true;
  }, [bloqueaMovimiento]);

  // Registrar/actualizar collider
  useEffect(() => {
    if (!id) return;

    upsertCollider(id, rectRegistro, {
      id,
      categoria,
      bloqueaMovimiento: bloquea,
    });

    return () => removeCollider(id);
  }, [
    id,
    rectRegistro.x,
    rectRegistro.y,
    rectRegistro.ancho,
    rectRegistro.alto,
    categoria,
    bloquea,
    upsertCollider,
    removeCollider,
  ]);

  // Render de imagen: URL (string) o Componente (SVGR)
  const RenderImagen = () => {
    if (!imagen) return null;

    // URL string
    if (typeof imagen === "string") {
      return (
        <img
          src={imagen}
          alt={id}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            userSelect: "none",
          }}
          draggable={false}
        />
      );
    }

    // Componente SVG (svgr)
    const ImgComp = imagen;
    return (
      <div style={{ width: "100%", height: "100%", display: "block" }}>
        <ImgComp width="100%" height="100%" />
      </div>
    );
  };

  // Color debug por categoría
  const colorCollider = useMemo(() => {
    const c = String(categoria || "").toLowerCase();
    if (c === "pared") return "rgba(255, 0, 0, 0.85)";
    if (c === "decoration" || c === "decoracion")
      return "rgba(0, 160, 255, 0.85)";
    return "rgba(0, 255, 0, 0.85)";
  }, [categoria]);

  /**
   * zIndex (profundidad)
   * - basado en la MITAD del collider (rectBase)
   * - si no hay colider, usa la mitad del sprite
   */
  const zIndex = useMemo(() => {
    const refY = rectBase.y + rectBase.alto / 2;
    return Math.max(10, Math.round(refY));
  }, [rectBase.y, rectBase.alto]);

  return (
    <>
      {/* Sprite (visual) */}
      <div
        style={{
          position: "absolute",
          left: sprite.left,
          top: sprite.top,
          width: sprite.ancho,
          height: sprite.alto,
          zIndex,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            position: "absolute",
            left: "20%",
            top: "10%",
          }}
        >
          {mostrarDebug ? id : ""}
        </p>
        <p
          style={{
            justifyContent: "center",
            position: "absolute",
            left: "20%",
            bottom: "20%",
          }}
        >
          {mostrarDebug ? id : ""}
        </p>

        <RenderImagen />

        {/* Debug: límites del sprite */}
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

      {/* Debug: collider registrado (en mundo) */}
      {mostrarDebug && (
        <div
          style={{
            position: "absolute",
            left: rectRegistro.x,
            top: rectRegistro.y,
            width: rectRegistro.ancho,
            height: rectRegistro.alto,
            border: `2px solid ${colorCollider}`,
            background: colorCollider.replace("0.85", "0.10"),
            zIndex: zIndex + 9999,
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </>
  );
}
