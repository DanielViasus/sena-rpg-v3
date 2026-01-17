import { useEffect, useRef } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

export default function SistemaMoverJugador() {
  const { jugador } = useEstadoJuego();
  const { establecerPosicionJugador, limpiarRutaJugador } = useAccionesJuego();

  // Refs para evitar dependencias cambiantes y bucles de efectos
  const posRef = useRef({ x: jugador.x, y: jugador.y });
  const rutaRef = useRef(jugador.ruta ?? []);
  const idxRef = useRef(0);
  const velRef = useRef(jugador.velocidad ?? 250);

  const accionesRef = useRef({ establecerPosicionJugador, limpiarRutaJugador });

  const rafRef = useRef(null);
  const corriendoRef = useRef(false);

  // Mantener refs sincronizados con el estado actual
  useEffect(() => {
    posRef.current = { x: jugador.x, y: jugador.y };
  }, [jugador.x, jugador.y]);

  useEffect(() => {
    rutaRef.current = jugador.ruta ?? [];
    idxRef.current = 0; // reinicia seguimiento cuando cambia la ruta
  }, [jugador.ruta]);

  useEffect(() => {
    velRef.current = jugador.velocidad ?? 250;
  }, [jugador.velocidad]);

  useEffect(() => {
    accionesRef.current = { establecerPosicionJugador, limpiarRutaJugador };
  }, [establecerPosicionJugador, limpiarRutaJugador]);

  // Loop único
  useEffect(() => {
    if (corriendoRef.current) return;
    corriendoRef.current = true;

    let last = performance.now();

    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      const ruta = rutaRef.current;
      const { x, y } = posRef.current;

      if (ruta.length && idxRef.current < ruta.length) {
        const objetivo = ruta[idxRef.current];
        const dx = objetivo.x - x;
        const dy = objetivo.y - y;
        const dist = Math.hypot(dx, dy);

        // si ya llegó al waypoint
        if (dist <= 1) {
          idxRef.current += 1;

          if (idxRef.current >= ruta.length) {
            accionesRef.current.limpiarRutaJugador();
          }
        } else {
          const vel = velRef.current;
          const paso = vel * dt;

          const nx = dist <= paso ? objetivo.x : x + (dx / dist) * paso;
          const ny = dist <= paso ? objetivo.y : y + (dy / dist) * paso;

          // IMPORTANTE: despachar solo si cambia
          const rx = Math.round(nx);
          const ry = Math.round(ny);

          if (rx !== x || ry !== y) {
            posRef.current = { x: rx, y: ry };
            accionesRef.current.establecerPosicionJugador(rx, ry);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      corriendoRef.current = false;
    };
  }, []);

  return null;
}
