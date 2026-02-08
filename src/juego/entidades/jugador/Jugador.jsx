import { useEffect, useRef } from "react";
import { useEstadoJuego } from "../../../estado/EstadoJuego.jsx";
import { selectorDeAspecto } from "../../../estado/selectorDeAspecto.jsx";

export default function Jugador({
  ancho = 128,
  alto = 128,
  mostrarSombra = false,
  mostrarDebug,
}) {
  const { jugador, debug } = useEstadoJuego();

  const {
    ancho: coliderAncho,
    alto: coliderAlto,
    offsetX: coliderOffsetX,
    offsetY: coliderOffsetY,
  } = jugador.colider;

  const debugActivo =
    typeof mostrarDebug === "boolean" ? mostrarDebug : debug.activo;

  // ✅ ¿Se está moviendo? (si hay ruta activa)
  const estaMoviendo = (jugador.ruta?.length || 0) > 0;

  // ✅ Animación actual
  const anim = estaMoviendo ? "walk" : "idle";

  // ✅ Skin según estado global (jugador.aspecto) + animación
  // Si jugador.aspecto no existe o no está en el mapa -> fallback a DEFAULT
  const src = selectorDeAspecto(jugador.aspecto, anim);

  // =========================
  // ✅ Dirección (flip)
  // =========================
  const dirRef = useRef("izquierda");
  const prevXRef = useRef(jugador.x);

  useEffect(() => {
    if (!estaMoviendo) {
      prevXRef.current = jugador.x; // resetea referencia al parar
      return;
    }

    const dxPos = jugador.x - prevXRef.current;
    prevXRef.current = jugador.x;

    // ✅ Deadzone: evita flips por 0.1px / snaps
    const UMBRAL = 1.5;
    if (Math.abs(dxPos) < UMBRAL) return;

    // ✅ Mantén tu mapeo invertido (según tu sprite)
    dirRef.current = dxPos < 0 ? "izquierda" : "derecha";
  }, [estaMoviendo, jugador.x]);

  const flipX = dirRef.current === "izquierda";

  // =========================
  // Posicionamiento anclado a pies
  // =========================
  const coliderLeft = Math.round((ancho - coliderAncho) / 2 + coliderOffsetX);
  const coliderTop = Math.round(alto - coliderAlto + coliderOffsetY);

  const piesXLocal = coliderLeft + coliderAncho / 2;
  const piesYLocal = coliderTop + coliderAlto;

  const spriteLeft = Math.round(jugador.x - piesXLocal);
  const spriteTop = Math.round(jugador.y - piesYLocal);

  const zIndex = Math.floor(jugador.y - coliderAlto / 2);

  return (
    <div
      style={{
        position: "absolute",
        left: spriteLeft,
        top: spriteTop,
        width: ancho,
        height: alto,
        pointerEvents: "none",
        zIndex,
      }}
      title={`pies x=${jugador.x} y=${jugador.y} z=${zIndex}`}
    >
      {mostrarSombra && (
        <div
          style={{
            position: "absolute",
            left: piesXLocal,
            top: piesYLocal,
            transform: "translate(-50%, -50%)",
            width: Math.round(ancho * 0.55),
            height: Math.max(8, Math.round(alto * 0.14)),
            borderRadius: "50%",
            background: "rgba(0,0,0,0.35)",
          }}
        />
      )}

      {/* ✅ Sprite (solo este se voltea) */}
      <img
        src={src || undefined}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",

          // ✅ Flip horizontal
          transform: flipX ? "scaleX(-1)" : "scaleX(1)",
          transformOrigin: "center",

          // útil para pixel art
          imageRendering: "pixelated",
        }}
      />

      {/* Debug */}
      {debugActivo && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              outline: "2px dashed rgba(255,255,255,0.45)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: coliderLeft,
              top: coliderTop,
              width: coliderAncho,
              height: coliderAlto,
              background: "rgba(50, 120, 255, 0.35)",
              outline: "2px solid rgba(50, 120, 255, 0.9)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: piesXLocal - 3,
              top: piesYLocal - 3,
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "rgba(0,255,0,0.95)",
            }}
          />
        </>
      )}
    </div>
  );
}
