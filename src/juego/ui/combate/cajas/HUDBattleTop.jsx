// src/ui/combate/cajas/HUDBattleTop.jsx
import { useMemo } from "react";
import "./HUDBattleTop.css";

// 👇 ideal: 3 estados (lleno/mitad/vacio)
import corazonLleno from "../../../../assets/ui/corazones/Corazon.svg";
import corazonMitad from "../../../../assets/ui/corazones/CorazonMitad.svg";
import corazonVacio from "../../../../assets/ui/corazones/CorazonVacio.svg";

// 👇 escudos
import escudoImg from "../../../../assets/ui/escudos/Escudos.svg";

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function ImgOrBox({
  src,
  alt,
  imgClassName,
  boxClassName,
  label,
  style,
}) {
  if (src) return <img className={imgClassName} src={src} alt={alt} style={style} />;

  return (
    <div className={boxClassName} aria-label={alt} style={style}>
      {label ? <div className="hbt-boxLabel">{label}</div> : null}
    </div>
  );
}

export default function HUDBattleTop({
  side = "left", // left | right
  name = "JUGADOR",

  // stats
  vida = 0,
  vidaMax = 6, // default: 6 (3 corazones)
  escudos = 0,

  // visual (opcionales)
  skinSrc = null,
  marcoSrc = null,

  // sprite framing (como HUDJugador)
  zoom = 1.45,
  zoomX = 0,
  zoomY = -8,

  // comportamiento
  flipSkin = false,

  // tamaño iconos
  iconSize = 22,
}) {
  const vidaMaxNorm = clamp(Math.floor(vidaMax ?? 6), 0, 6);
  const vidaNorm = clamp(Math.floor(vida ?? 0), 0, vidaMaxNorm || 6);

  // ✅ siempre 3 corazones = 6 vidas (2 vidas por corazón)
  // si vidaMax distinto a 6, igual lo forzamos visualmente a 6 por ahora (tu diseño)
  const vidaVisual = clamp(vidaNorm, 0, 6);

  const corazones = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const restante = vidaVisual - i * 2; // 2 vidas por corazón
      if (restante >= 2) return { tipo: "lleno", src: corazonLleno };
      if (restante === 1) return { tipo: "mitad", src: corazonMitad };
      return { tipo: "vacio", src: corazonVacio };
    });
  }, [vidaVisual]);

  const escudosArr = useMemo(() => {
    const n = clamp(Math.floor(escudos ?? 0), 0, 10);
    return Array.from({ length: n }, (_, i) => i);
  }, [escudos]);

  return (
    <div
      className={`hbtRoot hbtRoot--${side}`}
      style={{ ["--hbt-icon-size"]: `${iconSize}px` }}
    >
      <div className="hbtPanel">
        {/* AVATAR */}
        <div className="hbtAvatarBox">
          {/* Marco */}
          <ImgOrBox
            src={marcoSrc}
            alt="marco"
            imgClassName="hbtMarcoImg"
            boxClassName="hbtBox hbtBox--marco"
            label="MARCO"
          />

          {/* Viewport */}
          <div className="hbtAvatarViewport">
            <ImgOrBox
              src={skinSrc}
              alt="skin"
              imgClassName={`hbtAvatarSkin ${flipSkin ? "hbtAvatarSkin--flip" : ""}`}
              boxClassName="hbtBox hbtBox--skin"
              label="SKIN"
              style={{
                "--zoom": String(zoom),
                "--zoomX": `${zoomX}px`,
                "--zoomY": `${zoomY}px`,
              }}
            />
          </div>
        </div>

        {/* INFO */}
        <div className="hbtInfoCol">
          <p className="pixel-ui2 hbtNombre">{name}</p>

          <div className="hbtFilaIconos">
            {corazones.map((c, idx) => (
              <img
                key={`hp-${idx}-${c.tipo}`}
                className="hbtIcono"
                src={c.src}
                alt={`corazon-${c.tipo}`}
              />
            ))}

            {!!escudosArr.length && <div className="hbtSeparador" />}

            {escudosArr.map((i) => (
              <img
                key={`sh-${i}`}
                className="hbtIcono"
                src={escudoImg}
                alt="escudo"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
