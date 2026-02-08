// src/ui/combate/CombateBattleView.jsx
import "./CombateBattleView.css";
import HUDBattleTop from "./cajas/HUDBattleTop";

function clampAura(a) {
  const n = Math.floor(Number(a ?? 0));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, n));
}

function ImgOrBox({ src, alt, className, boxClassName, label }) {
  if (src) return <img className={className} src={src} alt={alt} />;
  return (
    <div className={boxClassName} aria-label={alt}>
      {label ? <div className="cbv-boxLabel">{label}</div> : null}
    </div>
  );
}

export default function CombateBattleView({
  // HUD values
  vidasJugador = 0,
  escudosJugador = 0,
  vidasRival = 0,
  escudosRival = 0,

  // Nombres
  nombreJugador = "JUGADOR",
  nombreRival = "RIVAL",

  // Turno / fase
  modo = "ATAQUE",
  indicadorPorModo = {},

  // Sprites (stage)
  jugadorSprite,
  rivalSprite,

  // HUD skins/marcos
  jugadorMarco = null,
  rivalMarco = null,
  jugadorSkin = null,
  rivalSkin = null,

  // Auras
  auraJugador = 0,
  auraRival = 0,
  bgAuraJugador = {},
  bgAuraRival = {},
  auraFrontJugador = {},
  auraFrontRival = {},
}) {
  const aJ = clampAura(auraJugador);
  const aR = clampAura(auraRival);

  const indicador = indicadorPorModo?.[modo] ?? null;

  const bgJ = Array.isArray(bgAuraJugador) ? bgAuraJugador[aJ] : bgAuraJugador?.[aJ];
  const bgR = Array.isArray(bgAuraRival) ? bgAuraRival[aR] : bgAuraRival?.[aR];

  const frJ = Array.isArray(auraFrontJugador) ? auraFrontJugador[aJ] : auraFrontJugador?.[aJ];
  const frR = Array.isArray(auraFrontRival) ? auraFrontRival[aR] : auraFrontRival?.[aR];

  return (
    <div className="pixel-ui2 cbv-root">
      <div className="pixel-ui2 cbv-hudRow">
        <HUDBattleTop
          side="left"
          name={nombreJugador}
          vida={vidasJugador}
          escudos={escudosJugador}
          marcoSrc={jugadorMarco}
          skinSrc={jugadorSkin}
        />

        <div className="pixel-ui2 cbv-turnCenter">
          <ImgOrBox
            src={indicador}
            alt={`Turno: ${modo}`}
            className="cbv-turnIcon"
            boxClassName="cbv-box cbv-box--turnIcon"
            label="TURN"
          />
          <div className="pixel-ui2 cbv-turnLabel">{modo}</div>
        </div>

        <HUDBattleTop
          side="right"
          name={nombreRival}
          vida={vidasRival}
          escudos={escudosRival}
          marcoSrc={rivalMarco}
          skinSrc={rivalSkin}
          flipSkin
        />
      </div>

      <div className="pixel-ui2 cbv-stage">
        <div className="pixel-ui2 cbv-fighter cbv-fighter--player">
          <ImgOrBox
            src={bgJ}
            alt="BG aura jugador"
            className="cbv-auraBg"
            boxClassName="cbv-box cbv-box--auraBgJ"
            label="AURA BG J"
          />
          <ImgOrBox
            src={jugadorSprite}
            alt="Sprite jugador"
            className="cbv-sprite cbv-sprite--player"
            boxClassName="cbv-box cbv-box--spriteJ"
            label="SPRITE J"
          />
          <ImgOrBox
            src={frJ}
            alt="Aura front jugador"
            className="cbv-auraFront"
            boxClassName="cbv-box cbv-box--auraFrontJ"
            label="AURA FR J"
          />
        </div>

        <div className="pixel-ui2 cbv-fighter cbv-fighter--rival">
          <ImgOrBox
            src={bgR}
            alt="BG aura rival"
            className="cbv-auraBg"
            boxClassName="cbv-box cbv-box--auraBgR"
            label="AURA BG R"
          />
          <ImgOrBox
            src={rivalSprite}
            alt="Sprite rival"
            className="cbv-sprite cbv-sprite--rival"
            boxClassName="cbv-box cbv-box--spriteR"
            label="SPRITE R"
          />
          <ImgOrBox
            src={frR}
            alt="Aura front rival"
            className="cbv-auraFront"
            boxClassName="cbv-box cbv-box--auraFrontR"
            label="AURA FR R"
          />
        </div>
      </div>
    </div>
  );
}
