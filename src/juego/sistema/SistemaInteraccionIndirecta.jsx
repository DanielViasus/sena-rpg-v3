import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";
import { useRegistroColisiones, useVersionRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.ancho &&
    a.x + a.ancho > b.x &&
    a.y < b.y + b.alto &&
    a.y + a.alto > b.y
  );
}

function normalizarTecla(t) {
  return (t || "E").toString().trim().toUpperCase();
}

export default function SistemaInteraccionIndirecta() {
  const { jugador } = useEstadoJuego();
  const {
    establecerInteraccionIndirecta,
    limpiarInteraccionIndirecta,
  } = useAccionesJuego();

  const registro = useRegistroColisiones();
  const version = useVersionRegistroColisiones();
  const location = useLocation();

  const zonaActivaRef = useRef(null);

  // Mantener acciones en ref (evitar closures viejas en listeners)
  const accionesRef = useRef({ establecerInteraccionIndirecta, limpiarInteraccionIndirecta });
  useEffect(() => {
    accionesRef.current = { establecerInteraccionIndirecta, limpiarInteraccionIndirecta };
  }, [establecerInteraccionIndirecta, limpiarInteraccionIndirecta]);

  // ✅ Limpieza fuerte al cambiar de ruta (corrige “icono pegado” al volver)
  useEffect(() => {
    zonaActivaRef.current = null;
    accionesRef.current.limpiarInteraccionIndirecta();
  }, [location.pathname]);

  // ✅ También limpiar al montar y desmontar
  useEffect(() => {
    accionesRef.current.limpiarInteraccionIndirecta();
    return () => {
      zonaActivaRef.current = null;
      accionesRef.current.limpiarInteraccionIndirecta();
    };
  }, []);

  // Rect del jugador (anclado a centro-bottom)
  const rectJugador = useMemo(() => {
    const col = jugador.colider ?? { ancho: 64, alto: 32, offsetX: 0, offsetY: 0 };

    const anclaX = Math.round(jugador.x + (col.offsetX ?? 0));
    const anclaY = Math.round(jugador.y + (col.offsetY ?? 0));

    return {
      x: Math.round(anclaX - col.ancho / 2),
      y: Math.round(anclaY - col.alto),
      ancho: Math.round(col.ancho),
      alto: Math.round(col.alto),
      cx: anclaX,
      cy: Math.round(anclaY - col.alto / 2),
    };
  }, [
    jugador.x,
    jugador.y,
    jugador.colider?.ancho,
    jugador.colider?.alto,
    jugador.colider?.offsetX,
    jugador.colider?.offsetY,
  ]);

  // Buscar zona indirecta activa
  useEffect(() => {
    let mejor = null;
    let mejorD2 = Infinity;

    for (const item of registro.values()) {
      const { rect, meta } = item || {};
      const cat = (meta?.categoria || "").toString().toLowerCase();
      if (cat !== "interaccionindirecta") continue;

      if (!rectsIntersect(rectJugador, rect)) continue;

      const zx = rect.x + rect.ancho / 2;
      const zy = rect.y + rect.alto / 2;

      const dx = zx - rectJugador.cx;
      const dy = zy - rectJugador.cy;
      const d2 = dx * dx + dy * dy;

      if (d2 < mejorD2) {
        mejorD2 = d2;
        mejor = { rect, meta };
      }
    }

    if (mejor) {
      zonaActivaRef.current = mejor;

      accionesRef.current.establecerInteraccionIndirecta({
        activa: true,
        tecla: mejor.meta?.tecla ?? "E",
        zonaId: mejor.meta?.id ?? null,
      });
    } else {
      zonaActivaRef.current = null;
      accionesRef.current.limpiarInteraccionIndirecta();
    }
  }, [version, rectJugador, registro]);

  // Listener de tecla (una sola vez)
  useEffect(() => {
    const onKeyDown = (e) => {
      const zona = zonaActivaRef.current;
      if (!zona) return;

      if (e.repeat) return;

      const teclaZona = normalizarTecla(zona.meta?.tecla);
      const k = normalizarTecla(e.key);

      if (k !== teclaZona) return;

      const fn = zona.meta?.alInteractuar;
      if (typeof fn === "function") fn();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
