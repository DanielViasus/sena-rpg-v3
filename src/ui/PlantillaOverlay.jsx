// src/ui/PlantillaOverlay.jsx
import { useEstadoJuego } from "../estado/EstadoJuego.jsx";
import PlantillaDialogo from "./plantillas/PlantillaDialogo.jsx";

export default function PlantillaOverlay() {
  const { ui } = useEstadoJuego();
  const activa = ui?.plantillaActiva ?? null;

  if (!activa) return null;

  // Render por ID
  switch (activa.id) {
    case "DIALOGO":
      return <PlantillaDialogo />;

    default:
      return null;
  }
}
