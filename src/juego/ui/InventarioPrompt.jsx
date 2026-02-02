import { useMemo } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../estado/EstadoJuego.jsx";
import "./InventarioPrompt.css";

import SlotItem from "./inventario/SlotItem.jsx";
import DetalleItemInventario from "./inventario/DetalleItemInventario.jsx";

import bgInventario from "../../assets/ui/inventario/bgInventario.svg";
import btnClose from "../../assets/ui/inventario/btnClose.png";
import baseHojaIzquierda from "../../assets/ui/inventario/hojaIzquierda/baseHojaIzquierda.png";
import baseHojaDerecha from "../../assets/ui/inventario/hojaDerecha/baseHojaDerecha.png";

import spriteIdle from "../../assets/svg/personajes/jugador/gifIdle_128x128_200ms.webp";

import corazonLleno from "../../assets/ui/corazones/Corazon.svg";
import corazonMitad from "../../assets/ui/corazones/CorazonMitad.svg";
import corazonVacio from "../../assets/ui/corazones/CorazonVacio.svg";

import escudoImg from "../../assets/ui/escudos/Escudos.svg";
import escudoVacio from "../../assets/ui/escudos/EscudosVacios.svg";

// ✅ ICONOS DE ITEMS
import iconoPosion from "../../assets/ui/slots/iconoPosion.svg";
import iconoSuperPosion from "../../assets/ui/slots/iconoSuperPosion.svg";
import iconoEscudoBasico from "../../assets/ui/slots/iconoEscudoBasico.svg";
import iconoEscudoLogoSena from "../../assets/ui/slots/iconoEscudoLogoSena.svg";
import iconoMonedas from "../../assets/ui/slots/itemPlaceholder.svg";

import bgDetalle from "../../assets/ui/slots/bgDetalle.png";

// Utils
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const SPRITES_POR_ASPECTO = {
  idle: spriteIdle,
};

export default function InventarioPrompt() {
  // ✅ Hooks siempre arriba
  const estado = useEstadoJuego();
  const {
    cerrarPlantilla,
    inventarioSeleccionar,
    inventarioDeseleccionar,
  } = useAccionesJuego();

  // ✅ Bandera: no retornes antes de hooks
  const plantilla = estado.ui?.plantillaActiva;
  const esInventario = !!plantilla && plantilla.id === "INVENTARIO";

  // ✅ Config de items (estable)
  const ITEMS_CONFIG = useMemo(
    () => ({
      posion: {
        nombre: "Posión",
        descripcion: "Restaura medio corazon. (de un solo uso)",
        tipo: "vida",
        valor: 1,
        icono: iconoPosion,
      },
      superPosion: {
        nombre: "Súper Posión",
        descripcion: "Restaura un corazon.",
        tipo: "vida",
        valor: 2,
        icono: iconoSuperPosion,
      },
      "escudo:basico": {
        nombre: "Escudo Básico",
        descripcion: "Otorga 1 escudo protector.",
        tipo: "escudo",
        valor: 1,
        icono: iconoEscudoBasico,
      },
      "escudo:logoSENA": {
        nombre: "Escudo SENA",
        descripcion: "Escudo especial con emblema SENA.",
        tipo: "escudo",
        valor: 1,
        icono: iconoEscudoLogoSena,
      },
      monedas: {
        nombre: "Monedas",
        descripcion: "Moneda de intercambio.",
        tipo: "moneda",
        valor: 6,
        icono: iconoMonedas,
      },
    }),
    []
  );

  // ✅ Datos del jugador (siempre calculados, aunque no se renderice)
  const datosJugador = useMemo(() => {
    const j = estado.jugador || {};
    const inv = j.inventario || {};

    return {
      name: j.name ?? "SIN NOMBRE",
      sprite: SPRITES_POR_ASPECTO[j.aspecto] ?? SPRITES_POR_ASPECTO.idle,
      vida: Number(j.vida ?? 0),
      escudosCombate: Number(j.escudos ?? 0),
      inventario: {
        superPosion: Math.max(0, Number(inv.superPosion ?? 0)),
        posion: Math.max(0, Number(inv.posion ?? 0)),
        monedas: Math.max(0, Number(inv.monedas ?? 0)),
        escudos: Array.isArray(inv.escudos) ? inv.escudos : [],
      },
    };
  }, [estado.jugador]);

  // Vida → corazones
  const vidaNormalizada = clamp(datosJugador.vida, 0, 6);

  const corazones = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const restante = vidaNormalizada - i * 2;
      if (restante >= 2) return { tipo: "lleno", src: corazonLleno };
      if (restante === 1) return { tipo: "mitad", src: corazonMitad };
      return { tipo: "vacio", src: corazonVacio };
    });
  }, [vidaNormalizada]);

  // Escudos de combate (0..1)
  const escudosCombate = useMemo(() => {
    const n = clamp(datosJugador.escudosCombate, 0, 1);
    return Array.from({ length: n }, (_, i) => i);
  }, [datosJugador.escudosCombate]);

  // Selección
  const seleccionadoId = estado.ui?.inventario?.seleccionadoId ?? null;

  // Slots 3x2
  const slots = useMemo(() => {
  const res = [];

  // ✅ Orden de prioridad (como tú lo vienes usando)
  const nSuper = Math.floor(Number(datosJugador.inventario.superPosion ?? 0));
  const nPosion = Math.floor(Number(datosJugador.inventario.posion ?? 0));

  // Solo se agregan si tienen cantidad > 0
  if (nSuper > 0) res.push({ id: "superPosion", cantidad: nSuper });
  if (nPosion > 0) res.push({ id: "posion", cantidad: nPosion });

  // Escudos (cada tipo ocupa 1 slot) — solo si existen
  (datosJugador.inventario.escudos || []).forEach((tipo) => {
    res.push({ id: `escudo:${tipo}`, cantidad: 1 });
  });

  // ✅ Relleno hasta 6 slots
  while (res.length < 6) {
    res.push({ id: `vacio:${res.length}`, cantidad: 0, vacio: true });
  }

  // ✅ Si por alguna razón hay más de 6, cortamos
  return res.slice(0, 6);
}, [
  datosJugador.inventario.superPosion,
  datosJugador.inventario.posion,
  datosJugador.inventario.escudos,
]);


  function onCerrar() {
    cerrarPlantilla();
  }

  function onClickSlot(slot) {
    if (slot.vacio) {
      inventarioDeseleccionar();
      return;
    }
    if (seleccionadoId === slot.id) inventarioDeseleccionar();
    else inventarioSeleccionar(slot.id);
  }

  // ✅ AHORA sí: retorno condicional AL FINAL de hooks
  if (!esInventario) return null;

  // Render
  return (
    <div className="invOverlay" onMouseDown={onCerrar}>
      <div className="invPanel" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className="invCerrar"
          onClick={onCerrar}
          type="button"
          aria-label="Cerrar"
          style={{ backgroundImage: `url(${btnClose})` }}
        />

        <div className="invContenedor" style={{ backgroundImage: `url(${bgInventario})` }}>
          {/* HOJA IZQUIERDA */}
          <div className="hojaIzquierda" style={{ backgroundImage: `url(${baseHojaIzquierda})` }}>
            <p className="pixel-ui2 nombreInventario">{datosJugador.name}</p>
            <p className="pixel-ui2 levelInventario">lvl. 19</p>

            <div className="invFilaJugadorVida">
              <img className="aspectoJugador" src={datosJugador.sprite} alt="Jugador" />

              <div className="invVidaWrapper">
                <div className="invVidaCol">
                  {corazones.map((c, idx) => (
                    <img key={`hp-${idx}`} className="invIconoVida" src={c.src} alt="" />
                  ))}
                </div>

                <div className="invEscudosCol">
                  {escudosCombate.length > 0 ? (
                    escudosCombate.map((i) => (
                      <img key={`sh-${i}`} className="invIconoEscudo" src={escudoImg} alt="" />
                    ))
                  ) : (
                    <img className="invIconoEscudo" src={escudoVacio} alt="" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* HOJA DERECHA */}
          <div className="hojaDerecha" style={{ backgroundImage: `url(${baseHojaDerecha})` }}>
            <p className="pixel-ui2 nombreInventario">Inventario</p>

            <div className="invGridSlots">
              {slots.map((s) => (
                <SlotItem
                  key={s.id}
                  id={s.id}
                  cantidad={s.cantidad}
                  seleccionado={seleccionadoId === s.id}
                  icono={ITEMS_CONFIG[s.id]?.icono}
                  onClick={() => onClickSlot(s)}
                />
              ))}
            </div>

            <DetalleItemInventario itemsConfig={ITEMS_CONFIG} bg={bgDetalle} />
          </div>
        </div>
      </div>
    </div>
  );
}
