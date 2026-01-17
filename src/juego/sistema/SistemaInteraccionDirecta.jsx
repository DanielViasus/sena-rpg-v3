import { useEffect, useRef } from "react";
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

function rectJugadorDesdePies(jugador) {
  const c = jugador.colider;
  const ancho = c.ancho;
  const alto = c.alto;

  const offsetX = c.offsetX ?? 0;
  const offsetY = c.offsetY ?? 0;

  // jugador.x/y son PIES/base
  const piesX = jugador.x;
  const piesY = jugador.y;

  return {
    x: piesX - ancho / 2 + offsetX,
    y: piesY - alto + offsetY,
    ancho,
    alto,
  };
}

export default function SistemaInteraccionDirecta() {
  const { jugador } = useEstadoJuego();
  const accionesJuego = useAccionesJuego();

  const registro = useRegistroColisiones();
  const version = useVersionRegistroColisiones();

  // Para disparar una sola vez al entrar
  const activosRef = useRef(new Set());

  // refs para loop
  const jugadorRef = useRef(jugador);
  const accionesRef = useRef(accionesJuego);
  const registroRef = useRef(registro);
  const versionRef = useRef(version);

  useEffect(() => void (jugadorRef.current = jugador), [jugador]);
  useEffect(() => void (accionesRef.current = accionesJuego), [accionesJuego]);
  useEffect(() => void (registroRef.current = registro), [registro]);
  useEffect(() => void (versionRef.current = version), [version]);

  useEffect(() => {
    let raf = 0;

    function tick() {
      const j = jugadorRef.current;
      const rectJ = rectJugadorDesdePies(j);

      // revisar zonas directas
      const nuevosActivos = new Set();

      for (const [id, item] of registroRef.current.entries()) {
        const { rect, meta } = item;
        if (!meta) continue;

        const cat = String(meta.categoria ?? "").toLowerCase();
        const esDirecta = cat === "interacciondirecta" || meta.tipoInteraccion === "directa";
        if (!esDirecta) continue;

        if (meta.activo === false) continue;

        const toca = rectsIntersect(rectJ, rect);
        if (toca) {
          nuevosActivos.add(id);

          // ENTER: si antes no estaba activo, disparar acción
          if (!activosRef.current.has(id)) {
            if (typeof meta.alInteractuar === "function") {
              meta.alInteractuar({
                id,
                jugador: j,
                accionesJuego: accionesRef.current,
                meta,
              });
            } else if (meta.accionPayload) {
              // Soporte “suave”: si aún no tienes dispatch genérico, no rompe nada
              console.warn(
                `[InteraccionDirecta] accionPayload recibido pero no hay alInteractuar. id=${id}`,
                meta.accionPayload
              );
            }
          }
        }
      }

      // actualizar estado de “dentro de zona”
      activosRef.current = nuevosActivos;

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
