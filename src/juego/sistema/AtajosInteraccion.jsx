import { useEffect } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

function estaEscribiendoEnInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

export default function AtajosInteraccion() {
  const { interaccion } = useEstadoJuego();
  const { reiniciarJugador } = useAccionesJuego();

  useEffect(() => {
    //*
    function onKeyDown(e) {
      if (e.repeat) return;
      if (estaEscribiendoEnInput()) return;

      //const ind = interaccion.indirecta;
      //if (!ind.activa) return;

    //if ((e.key || "").toUpperCase() === (ind.tecla || "E").toUpperCase()) {
        // Acción demo: reiniciar
      //  reiniciarJugador();
      //}
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [interaccion, reiniciarJugador]);

  return null;
}
