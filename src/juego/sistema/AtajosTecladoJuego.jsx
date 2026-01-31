import { useEffect } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";

export default function AtajosTecladoJuego() {
  const estado = useEstadoJuego();
  const { establecerDebug, abrirPlantilla, cerrarPlantilla } = useAccionesJuego();

  const debugActivo = !!estado.debug?.activo;
  const plantilla = estado.ui?.plantillaActiva;
  const inventarioAbierto = !!plantilla && plantilla.id === "INVENTARIO";

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;

      // Evita atajos si estás escribiendo en inputs
      const tag = e.target?.tagName?.toLowerCase();
      const esCampoTexto = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (esCampoTexto) return;

      const k = (e.key || "").toLowerCase();

      // Debug
      if (k === "p") {
        establecerDebug(!debugActivo);
        return;
      }

      // Inventario (toggle)
      if (k === "i") {
        e.preventDefault();
        if (inventarioAbierto) cerrarPlantilla();
        else abrirPlantilla({ id: "INVENTARIO", props: {} });
        return;
      }

      // Escape: si está inventario, cerrarlo
      if (k === "escape") {
        if (inventarioAbierto) {
          e.preventDefault();
          cerrarPlantilla();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abrirPlantilla, cerrarPlantilla, establecerDebug, debugActivo, inventarioAbierto]);

  return null;
}
