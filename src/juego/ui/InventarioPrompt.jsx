import { useMemo } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";
import "./InventarioPrompt.css";

import bgInventario from "../../assets/ui/inventario/bgInventario.svg";
import btnClose from "../../assets/ui/inventario/btnClose.png";

export default function InventarioPrompt() {
  const estado = useEstadoJuego();
  const { cerrarPlantilla } = useAccionesJuego();

  const plantilla = estado.ui?.plantillaActiva;

  if (!plantilla || plantilla.id !== "INVENTARIO") return null;

  const inventario = useMemo(() => {
    return estado.jugador?.inventario || {};
  }, [estado.jugador?.inventario]);

  function onCerrar() {
    cerrarPlantilla();
  }

  return (
    <div className="invOverlay" onMouseDown={onCerrar}>
      <div className="invPanel" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className="invCerrar"
          onClick={onCerrar}
          type="button"
          aria-label="Cerrar"
          style={{ backgroundImage:`url(${btnClose})` }}
        >
          
        </button>

        <div
          className="invContenedor"
          style={{
            backgroundImage: `url(${bgInventario})`,
          }}
        >
          {/* contenido futuro */}
        </div>
      </div>
    </div>
  );
}
