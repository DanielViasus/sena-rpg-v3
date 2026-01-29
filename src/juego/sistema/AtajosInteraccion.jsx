import { useEffect, useRef } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";
import { useRegistroColisiones } from "../colisiones/RegistroColisiones.jsx";

function estaEscribiendoEnInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

function normKey(k) {
  return (k || "").toString().toUpperCase();
}

export default function AtajosInteraccion() {
  const { interaccion, ui } = useEstadoJuego();
  const registro = useRegistroColisiones();

  const interaccionRef = useRef(interaccion);
  const uiRef = useRef(ui);
  const registroRef = useRef(registro);

  useEffect(() => void (interaccionRef.current = interaccion), [interaccion]);
  useEffect(() => void (uiRef.current = ui), [ui]);
  useEffect(() => void (registroRef.current = registro), [registro]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat) return;
      if (estaEscribiendoEnInput()) return;

      // Si hay overlay/plantilla abierta, NO dispares interacción del mundo
      if (uiRef.current?.plantillaActiva) return;

      const ind = interaccionRef.current?.indirecta;
      if (!ind?.activa) return;

      const tecla = normKey(ind.tecla || "E");
      const key = normKey(e.key);

      if (key !== tecla) return;

      // 1) si el estado ya trae alInteractuar, úsalo
      if (typeof ind.alInteractuar === "function") {
        e.preventDefault();
        ind.alInteractuar();
        return;
      }

      // 2) si no, busca en RegistroColisiones y ejecuta meta.alInteractuar
      const rid = ind.id || ind.zonaId || ind.origenZonaId;
      if (!rid) return;

      const item = registroRef.current?.get(rid);
      const fn = item?.meta?.alInteractuar;

      if (typeof fn === "function") {
        e.preventDefault();
        fn();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}





/*import { useEffect, useRef } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

function estaEscribiendoEnInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

function normalizarTecla(t) {
  return (t || "").toString().trim().toUpperCase();
}

export default function AtajosInteraccion() {
  const estado = useEstadoJuego();
  const acciones = useAccionesJuego();

  // ✅ refs para evitar re-montar listeners por dependencias
  const estadoRef = useRef(estado);
  const accionesRef = useRef(acciones);

  useEffect(() => void (estadoRef.current = estado), [estado]);
  useEffect(() => void (accionesRef.current = acciones), [acciones]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat) return;
      if (estaEscribiendoEnInput()) return;

      const st = estadoRef.current;

      // ✅ Guard: si hay un overlay/plantilla activa, NO dispares atajos globales
      if (st?.ui?.plantillaActiva) return;

      // ✅ Si quieres que solo funcione cuando haya zona indirecta activa:
      // const ind = st?.interaccionIndirecta;
      // if (!ind?.activa) return;

      // Ejemplo (DEMO) — lo dejo apagado:
      // if (normalizarTecla(e.key) === "R") {
      //   accionesRef.current.reiniciarJugador?.();
      // }

      // Ejemplo de “usar E” solo si hay interaccionIndirecta activa:
      // if (ind?.activa && normalizarTecla(e.key) === normalizarTecla(ind.tecla || "E")) {
      //   accionesRef.current.reiniciarJugador?.();
      // }
    }

    // bubble está bien aquí; el overlay ya captura y consume la E con stopImmediatePropagation
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
*/