// src/ui/combate/cajas/CajaMenuAccion.jsx
import "./CajaMenuAccion.css";

import bgFondo from "../../../../assets/ui/combate/cajas/bgFondo01.png";

// BG del título (solo BG)
import bgTitle from "../../../../assets/ui/combate/cajas/bgTitle.png";

// BG de cada botón (SVG)
import bgBtnAtacar from "../../../../assets/ui/combate/cajas/bgBtnAccions.png";
import bgBtnAura from "../../../../assets/ui/combate/cajas/bgBtnAccions.png";
import bgBtnTienda from "../../../../assets/ui/combate/cajas/bgBtnAccions.png";
import bgBtnHuir from "../../../../assets/ui/combate/cajas/bgBtnAccions.png";

// Iconos (100x100)
import icoAtacar from "../../../../assets/ui/combate/cajas/btnIniciarCombate.svg";
import icoAura from "../../../../assets/ui/combate/cajas/btnAumentarAura.svg";
import icoTienda from "../../../../assets/ui/combate/cajas/btnInventario.svg";
import icoHuir from "../../../../assets/ui/combate/cajas/btnAbandornar.svg";

export default function CajaMenuAccion({
  titulo = "ELIGE TU ACCIÓN",

  auraNivel = 0,
  tierActual = 1,
  tierSiguiente = 1,
  atkMult = 1,

  onAtacar,
  onAumentarAura,
  onHuir,
}) {
  const auraNow = Math.max(0, Math.floor(Number(auraNivel || 0)));
  const auraNext = auraNow + 1;
  const mult = Math.max(1, Math.floor(Number(atkMult || 1)));

  return (
    <div
      className="pixel-ui2 cma-root"
      
    >
      {/* Header (solo BG) */}
      <div
        className="pixel-ui2 cma-header"
        style={{ backgroundImage: `url(${bgTitle})` }}
      >
        <div className="pixel-ui2 cma-headerText">{titulo}</div>
      </div>

      {/* Botonera */}
      <div className="pixel-ui2 cma-grid">
        {/* ATACAR */}
        <button
          className="pixel-ui2 cma-btn"
          onClick={onAtacar}
          style={{ backgroundImage: `url(${bgBtnAtacar})` }}
        >
          <img className="cma-icon" src={icoAtacar} alt="Atacar" />
          <div className="pixel-ui2 cma-sub">Golpe x{mult}</div>
          <div className="pixel-ui2 cma-title">ATACAR</div>
        </button>

        {/* AURA */}
        <button
          className="pixel-ui2 cma-btn"
          onClick={onAumentarAura}
          style={{ backgroundImage: `url(${bgBtnAura})` }}
        >
          <img className="cma-icon" src={icoAura} alt="Aumentar Aura" />
          <div className="pixel-ui2 cma-sub">
            Aura: {auraNow} ▶ {auraNext}
          </div>
          <div className="pixel-ui2 cma-title">AUMENTAR AURA</div>
        </button>

        {/* TIENDA */}
        <button
          className="pixel-ui2 cma-btn cma-btn--disabled"
          disabled
          style={{ backgroundImage: `url(${bgBtnTienda})` }}
        >
          <img className="cma-icon" src={icoTienda} alt="Tienda" />
          <div className="pixel-ui2 cma-sub">(Próximamente)</div>
          <div className="pixel-ui2 cma-title">TIENDA</div>
        </button>

        {/* HUIR */}
        <button
          className="pixel-ui2 cma-btn"
          onClick={onHuir}
          style={{ backgroundImage: `url(${bgBtnHuir})` }}
        >
          <img className="cma-icon" src={icoHuir} alt="Huir" />
          <div className="pixel-ui2 cma-sub">Abandonas el combate</div>
          <div className="pixel-ui2 cma-title">HUIR</div>
        </button>
      </div>
    </div>
  );
}
