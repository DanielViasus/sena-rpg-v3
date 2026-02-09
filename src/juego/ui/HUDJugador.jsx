// src/ui/HUDJugador.jsx
import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";
import "./HUDJugador.css";

import skin from "../../assets/svg/personajes/jugador/gifIdle_128x128_200ms.webp";
import marco from "../../assets/ui/marcos/marcoDePiedra.svg";

import corazonLleno from "../../assets/ui/corazones/Corazon.svg";
import corazonMitad from "../../assets/ui/corazones/CorazonMitad.svg";
import corazonVacio from "../../assets/ui/corazones/CorazonVacio.svg";

import escudoImg from "../../assets/ui/escudos/Escudos.svg";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function HUDJugador() {
  const estado = useEstadoJuego();

  const plantilla = estado.ui?.plantillaActiva;

  // ✅ ocultar HUD si inventario o combate están activos
  const ocultarHUD = !!plantilla && (plantilla.id === "INVENTARIO" || plantilla.id === "COMBATE_RIVAL");
  if (ocultarHUD) return null;

  const zoom = 1.45;
  const zoomX = 0;
  const zoomY = -8;

  const datos = useMemo(() => {
    const vida = estado.jugador?.vida ?? 6;
    const vidaMax = estado.jugador?.vidaMax ?? 6;
    const escudos = estado.jugador?.escudos ?? 0;
    const nombre = estado.jugador?.nombre ?? "JUGADOR";
    return { vida, vidaMax, escudos, nombre };
  }, [estado.jugador?.vida, estado.jugador?.vidaMax, estado.jugador?.escudos, estado.jugador?.nombre]);

  const vidaNormalizada = clamp(datos.vida, 0, 6);

  const corazones = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const restante = vidaNormalizada - i * 2;
      if (restante >= 2) return { tipo: "lleno", src: corazonLleno };
      if (restante === 1) return { tipo: "mitad", src: corazonMitad };
      return { tipo: "vacio", src: corazonVacio };
    });
  }, [vidaNormalizada]);

  const escudos = useMemo(() => {
    const n = clamp(datos.escudos, 0, 10);
    return Array.from({ length: n }, (_, i) => i);
  }, [datos.escudos]);

  const ICON_SIZE = 22;

  return (
    <div className="hudRoot" style={{ ["--hud-icon-size"]: `${ICON_SIZE}px` }}>
      <div className="hudPanel">
        <div
          className="avatarBox"
          style={{
            backgroundImage: `url(${marco})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "center",
          }}
        >
          <div className="avatarViewport">
            <img
              className="avatarSkin"
              src={skin}
              alt="skin"
              draggable={false}
              style={{
                "--zoom": String(zoom),
                "--zoomX": `${zoomX}px`,
                "--zoomY": `${zoomY}px`,
              }}
            />
          </div>
        </div>

        <div className="infoCol">
          <p className="pixel-ui nombre">{datos.nombre}</p>

          <div className="filaIconos">
            {corazones.map((c, idx) => (
              <img key={`hp-${idx}-${c.tipo}`} className="iconoVida" src={c.src} alt={`corazon-${c.tipo}`} draggable={false} />
            ))}

            {!!escudos.length && <div className="separador" />}

            {escudos.map((i) => (
              <img key={`sh-${i}`} className="iconoVida" src={escudoImg} alt="escudo" draggable={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
