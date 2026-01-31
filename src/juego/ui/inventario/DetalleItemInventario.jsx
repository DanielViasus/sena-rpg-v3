import "./DetalleItemInventario.css";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";

/**
 * itemsConfig: {
 *   [idItem]: {
 *     nombre: string,
 *     descripcion: string,
 *     tipo: "vida" | "escudo",
 *     valor: number, // vida: 1/2... escudo: 1
 *     icono: string (import)
 *   }
 * }
 */
export default function DetalleItemInventario({
  itemsConfig = {},
  bg,
  vidaMax = 6,
  maxEscudos = 1,
}) {
  const estado = useEstadoJuego();

  const {
    inventarioQuitarItem,
    setVidaJugador,
    setEscudosJugador,
    // si aún no lo tienes, lo agregamos luego:
    inventarioDeseleccionar,
  } = useAccionesJuego();

  const seleccionadoId = estado.ui?.inventario?.seleccionadoId || null;

  const vidaActual = Number(estado.jugador?.vida ?? 0);
  const escudosActuales = Number(estado.jugador?.escudos ?? 0);

  const item = seleccionadoId ? itemsConfig[seleccionadoId] : null;

  // ✅ si NO hay seleccionado o no existe config, renderiza solo BG
  const mostrarContenido = !!item;

  // ✅ reglas de bloqueo
  const vidaLlena = vidaActual >= vidaMax;
  const escudoLleno = escudosActuales >= maxEscudos;

  let deshabilitado = false;
  if (item?.tipo === "vida" && vidaLlena) deshabilitado = true;
  if (item?.tipo === "escudo" && escudoLleno) deshabilitado = true;

  function usarItem() {
    if (!item || deshabilitado) return;

    if (item.tipo === "vida") {
      const nuevaVida = Math.min(vidaMax, vidaActual + Number(item.valor || 0));
      setVidaJugador(nuevaVida);
      inventarioQuitarItem(seleccionadoId, 1);
    }

    if (item.tipo === "escudo") {
      // ✅ solo 1 escudo equipado
      setEscudosJugador(Math.min(maxEscudos, escudosActuales + Number(item.valor || 1)));
      inventarioQuitarItem(seleccionadoId, 1);
    }

    // ✅ opcional: deseleccionar (si existe en tus acciones)
    if (typeof inventarioDeseleccionar === "function") inventarioDeseleccionar();
  }

  return (
    <div
      className="detalleItem"
      style={{ backgroundImage: bg ? `url(${bg})` : "none" }}
    >
      {mostrarContenido && (
        <>
          <img className="detalleIcono" src={item.icono} alt={item.nombre || ""} />

          <div className="detalleInfo">
            <h3 className="detalleNombre">{item.nombre}</h3>
            <p className="detalleDescripcion">{item.descripcion}</p>
          </div>

          <button
            className="detalleBtnUsar"
            onClick={usarItem}
            disabled={deshabilitado}
            type="button"
          >
            USAR
          </button>
        </>
      )}
    </div>
  );
}
