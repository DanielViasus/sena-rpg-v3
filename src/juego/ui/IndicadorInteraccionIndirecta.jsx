// src/juego/ui/IndicadorInteraccionIndirecta.jsx
import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";

export default function IndicadorInteraccionIndirecta({
  imagen,
  tam = 128,
  altoJugador = 128,
  offsetX = 0,
  offsetY = 0,
  zIndex = 999998,
}) {
  const { jugador, interaccionIndirecta } = useEstadoJuego();

  const visible = !!interaccionIndirecta?.activa && !!imagen;

  // ✅ Hook SIEMPRE se ejecuta (no condicional)
  const estilo = useMemo(() => {
    // jugador.x/y son PIES
    const left = Math.round(jugador.x - tam / 2 + offsetX);
    const top = Math.round(jugador.y - altoJugador - tam + offsetY);

    return {
      position: "absolute",
      left,
      top,
      width: tam,
      height: tam,
      pointerEvents: "none",
      zIndex,
      // opcional si quieres look pixel perfect:
      imageRendering: "pixelated",
    };
  }, [jugador.x, jugador.y, tam, altoJugador, offsetX, offsetY, zIndex]);

  // ✅ Return condicional DESPUÉS de los hooks
  if (!visible) return null;

  return <img src={imagen} alt="" draggable={false} style={estilo} />;
}



/*



// src/juego/ui/IndicadorInteraccionIndirecta.jsx
import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";

function renderImagen(imagen, id) {
  if (!imagen) return null;

  if (typeof imagen === "string") {
    return (
      <img
        src={imagen}
        alt={id || "icono"}
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />
    );
  }

  const Comp = imagen; // SVGR
  return <Comp width="100%" height="100%" />;
}

export default function IndicadorInteraccionIndirecta({
  imagen,
  tam = 128,
  altoJugador = 128,
  offsetX = 0,
  offsetY = 0,
}) {
  const { jugador, interaccionIndirecta } = useEstadoJuego();

  if (!interaccionIndirecta?.activa) return null;

  const left = Math.round(jugador.x - tam / 2 + offsetX);
  const top = Math.round(jugador.y - altoJugador - tam + offsetY);

  const zIndex = useMemo(() => {
    // siempre encima del jugador y objetos
    return Math.max(99999, Math.round(jugador.y) + 30000);
  }, [jugador.y]);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: tam,
        height: tam,
        zIndex,
        pointerEvents: "none",
      }}
    >
      {renderImagen(imagen, "indicador_interaccion_indirecta")}
    </div>
  );
}


---------------------------------------------------

// src/game/ui/IndicadorInteraccionIndirecta.jsx
import React from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";

 * IndicadorInteraccionIndirecta
 * - Dibuja un icono 128x128 (o tam) SOBRE el jugador cuando `mostrar` sea true.
 * - x,y del jugador están ANCLADOS A PIES (centro-bottom).
 * - Importante: NO usar hooks condicionales (evita el error de orden de hooks).
 
export default function IndicadorInteraccionIndirecta({
  mostrar = false,
  imagen = null,

  // Tamaño del icono
  tam = 128,

  // Alto visual del jugador (para poner el icono sobre la cabeza)
  altoJugador = 128,

  // Ajustes finos
  offsetX = 0,
  offsetY = 0,

  zIndex = 999999,
}) {
  const { jugador } = useEstadoJuego(); // (hook 1) siempre se ejecuta

  // Si no hay que mostrar, salimos DESPUÉS del hook (esto es válido)
  if (!mostrar || !imagen) return null;

  // Como jugador.x,y son "pies":
  // top del jugador = y - altoJugador
  // top del icono = (y - altoJugador) - tam  (+ offsetY)
  const left = Math.round(jugador.x - tam / 2 + offsetX);
  const top = Math.round(jugador.y - altoJugador - tam + offsetY);

  const RenderImagen = () => {
    // Si es URL string
    if (typeof imagen === "string") {
      return (
        <img
          src={imagen}
          alt="indicador-interaccion"
          draggable={false}
          style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        />
      );
    }

    // Si es componente SVG (SVGR)
    const ImgComp = imagen;
    return (
      <div style={{ width: "100%", height: "100%", display: "block" }}>
        <ImgComp width="100%" height="100%" />
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: tam,
        height: tam,
        zIndex,
        pointerEvents: "none",
      }}
    >
      <RenderImagen />
    </div>
  );
}
*/