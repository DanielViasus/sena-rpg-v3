import { useEffect } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

export default function AtajosTecladoJuego() {
  const { debug } = useEstadoJuego();
  const { establecerDebug } = useAccionesJuego();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;

      const k = (e.key || "").toLowerCase();
      if (k === "p") {
        establecerDebug(!debug.activo);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [debug.activo, establecerDebug]);

  return null;
}
