import { useMemo } from "react";
import { useEstadoJuego } from "../../estado/EstadoJuego.jsx";
import "./HUDJugador.css";

import skin from "../../assets/svg/personajes/jugador/gifIdle_128x128_200ms.webp";
import marco from "../../assets/ui/marcos/marcoDePiedra.svg";

// 👇 ideal: 3 estados (lleno/mitad/vacio)
import corazonLleno from "../../assets/ui/corazones/Corazon.svg";
import corazonMitad from "../../assets/ui/corazones/CorazonMitad.svg";
import corazonVacio from "../../assets/ui/corazones/CorazonVacio.svg";

// 👇 escudo (mismo tamaño que corazón)
import escudoImg from "../../assets/ui/escudos/Escudo.svg";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function HUDJugador() {
  const estado = useEstadoJuego();

  // ✅ Si el inventario está abierto, no renderiza HUD
  const plantilla = estado.ui?.plantillaActiva;
  const inventarioAbierto = !!plantilla && plantilla.id === "INVENTARIO";
  if (inventarioAbierto) return null;

  // Ajuste del "encuadre" del sprite dentro del marco (NO es escalado del HUD)
  const zoom = 1.45; // prueba 1.25–1.55
  const zoomX = 0; // px
  const zoomY = -8; // px (negativo = sube hacia la cara)

  const datos = useMemo(() => {
    const vida = estado.jugador?.vida ?? 6; // ejemplo
    const vidaMax = estado.jugador?.vidaMax ?? 6; // ejemplo
    const escudos = estado.jugador?.escudos ?? 0;

    const nombre = estado.jugador?.nombre ?? "Daniel Alejandro Viasus S.";

    return { vida, vidaMax, escudos, nombre };
  }, [
    estado.jugador?.vida,
    estado.jugador?.vidaMax,
    estado.jugador?.escudos,
    estado.jugador?.nombre,
  ]);

  // ✅ siempre 3 corazones = 6 vidas (2 vidas por corazón)
  const vidaNormalizada = clamp(datos.vida, 0, 6);

  const corazones = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const restante = vidaNormalizada - i * 2; // 2 vidas por corazón
      if (restante >= 2) return { tipo: "lleno", src: corazonLleno };
      if (restante === 1) return { tipo: "mitad", src: corazonMitad };
      return { tipo: "vacio", src: corazonVacio };
    });
  }, [vidaNormalizada]);

  const escudos = useMemo(() => {
    const n = clamp(datos.escudos, 0, 10); // por si acaso
    return Array.from({ length: n }, (_, i) => i);
  }, [datos.escudos]);

  // ✅ Tamaño global de iconos (subido un poco)
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
              <img
                key={`hp-${idx}-${c.tipo}`}
                className="iconoVida"
                src={c.src}
                alt={`corazon-${c.tipo}`}
              />
            ))}

            {!!escudos.length && <div className="separador" />}

            {escudos.map((i) => (
              <img key={`sh-${i}`} className="iconoVida" src={escudoImg} alt="escudo" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
