import "./SlotItem.css";

import slotBg from "../../../assets/ui/slots/slotBg.png";
import slotBgSelected from "../../../assets/ui/slots/slotBgSelected.png";
import contadorBg from "../../../assets/ui/slots/contadorBg.png";

// Placeholder temporal (puedes borrar luego)
import itemPlaceholder from "../../../assets/ui/slots/itemPlaceholder.svg";

export default function SlotItem({
  id,
  seleccionado = false,
  cantidad = 0,
  icono,
  onClick,
}) {
  const bg = seleccionado ? slotBgSelected : slotBg;

  const n = Number.isFinite(Number(cantidad)) ? Math.floor(Number(cantidad)) : 0;
  const esVacio = n <= 0;
  const mostrarIcono = !esVacio;
  const mostrarContador = n >= 2;

  return (
    <button
      type="button"
      className="slotItem"
      onClick={onClick}
      aria-pressed={seleccionado}
      style={{ backgroundImage: `url(${bg})` }}
    >
      {mostrarIcono && (
        <img className="slotItemIcon" src={icono || itemPlaceholder} alt="" />
      )}

      {mostrarContador && (
        <div
          className="slotItemContador"
          style={{ backgroundImage: `url(${contadorBg})` }}
        >
          <span className="slotItemCantidad pixel-ui2">{n}</span>
        </div>
      )}
    </button>
  );
}
