// src/juego/ui/MarcaClick.jsx
import React, { useMemo } from "react";

/**
 * MarcaClick
 * - Renderiza una marca (imagen) en coordenadas del mundo (x,y).
 * - Anclaje: CENTRO (x,y).
 * - Soporta imagen como URL (string) o componente SVG (SVGR).
 */
export default function MarcaClick({
  x,
  y,
  tam = 64,
  imagen,
  mostrar = true,
  zIndex = 999999,
  opacity = 0.9,
}) {
  const style = useMemo(() => {
    const half = tam / 2;
    return {
      position: "absolute",
      left: Math.round(x - half),
      top: Math.round(y - half),
      width: Math.round(tam),
      height: Math.round(tam),
      zIndex,
      pointerEvents: "none",
      opacity,
    };
  }, [x, y, tam, zIndex, opacity]);

  const RenderImagen = () => {
    if (!imagen) return null;

    // URL string (vite normalmente entrega string al importar svg/png/gif)
    if (typeof imagen === "string") {
      return (
        <img
          src={imagen}
          alt="marca-click"
          style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
          draggable={false}
        />
      );
    }

    // Componente SVG (SVGR)
    const ImgComp = imagen;
    return (
      <div style={{ width: "100%", height: "100%", display: "block" }}>
        <ImgComp width="100%" height="100%" />
      </div>
    );
  };

  if (!mostrar) return null;

  return (
    <div style={style}>
      <RenderImagen />
    </div>
  );
}
