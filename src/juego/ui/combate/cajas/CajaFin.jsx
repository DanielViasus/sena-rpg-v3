// src/ui/combate/cajas/CajaFin.jsx
import "./CajaFin.css";

export default function CajaFin({ mensaje = "COMBATE FINALIZADO.", resultado = null, onSalir }) {
  const info =
    resultado === "WIN"
      ? "✅ LOS PUNTOS DEL COMBATE SE ACUMULARON."
      : "❌ LOS PUNTOS DEL COMBATE FUERON DESCARTADOS.";

  return (
    <div className="pixel-ui2 caja-fin">
      <div className="pixel-ui2 caja-fin__bar">
        <div className="pixel-ui2 caja-fin__barText">{mensaje}</div>
      </div>

      <div className="pixel-ui2 caja-fin__info">{info}</div>

      <div className="pixel-ui2 caja-fin__actions">
        <button className="pixel-ui2 caja-fin__btn" onClick={onSalir}>
          SALIR
        </button>
      </div>
    </div>
  );
}
