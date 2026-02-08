// src/ui/combate/CombatePromptRival.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import test from "./../test/listadoTest.js";
import "./CombatePromptRival.css";

// ✅ selectores de skins
import { selectorDeAspecto, selectorDeRival } from "../../../estado/selectorDeAspecto.jsx";

// ✅ Fondo del PANEL
import bgPanel from "../../../assets/fondos/bgPanel.png";

const ENEMIGOS_POR_TIER = {
  1: { vidas: 4, probEscudosAdicionales: 0.08, escudosAdicionales: 1, escudosPorDefecto: 0 },
  2: { vidas: 6, probEscudosAdicionales: 0.08, escudosAdicionales: 1, escudosPorDefecto: 0 },
  3: { vidas: 8, probEscudosAdicionales: 0.1, escudosAdicionales: 1, escudosPorDefecto: 0 },
};

const AURA_REGLAS = {
  0: { atkMult: 1, defFailMult: 1, tierBonus: 0 },
  1: { atkMult: 3, defFailMult: 2, tierBonus: 1 },
  2: { atkMult: 5, defFailMult: 3, tierBonus: 2 },
  3: { atkMult: 7, defFailMult: 4, tierBonus: 3 },
};

const TECLAS_OPCION = ["S", "E", "N", "A"];

function clampTier(t) {
  const n = Number(t);
  if (!Number.isFinite(n)) return 1;
  return Math.min(3, Math.max(1, Math.round(n)));
}
function clampAuraLevel(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
}
function pickRandom(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
function getBancoPorTier(tier) {
  const t = clampTier(tier);
  if (t === 1) return test.tier1 ?? [];
  if (t === 2) return test.tier2 ?? [];
  return test.tier3 ?? [];
}
function getAuraReglas(auraNivel) {
  const lvl = clampAuraLevel(auraNivel);
  if (AURA_REGLAS[lvl]) return AURA_REGLAS[lvl];
  return { atkMult: 1 + 2 * lvl, defFailMult: 1 + lvl, tierBonus: lvl };
}

export default function CombatePromptRival() {
  const estado = useEstadoJuego();
  const {
    cerrarPlantilla,
    derrotarEnemigo,
    jugadorRecibirDanio,

    // puntaje
    puntajeResetCombate,
    puntajeAplicarTurno,
    puntajeDescartarCombate,
    puntajeCerrarCombateYSumarTotal,

    // preguntas globales
    preguntaMarcarAcertada,
  } = useAccionesJuego();

  const plantilla = estado.ui?.plantillaActiva;
  if (!plantilla || plantilla.id !== "COMBATE_RIVAL") return null;

  const origenZonaId = plantilla.origenZonaId;
  const props = plantilla.props || {};

  const rivalNombre = String(props.rivalNombre ?? "").trim() || "RIVAL";
  const rivalTierProp = props.rivalTier ?? props.tier ?? 1;
  const rivalVidasProp = props.rivalVidas;
  const rivalEscudosProp = props.rivalEscudos;

  // ✅ familia para selectorDeRival
  const rivalFamilia = String(props.rivalFamilia ?? props.familia ?? "CALAVERA").trim() || "CALAVERA";

  const titulo = props.titulo ?? "COMBATE";
  const texto = props.texto ?? "Combate por turnos.";

  const baseTier = clampTier(rivalTierProp);

  const danioPerderBase = Number.isFinite(props.danioPerder) ? props.danioPerder : 1;
  const feedbackDelayMs = Number.isFinite(props.feedbackDelayMs) ? props.feedbackDelayMs : 2000;

  const debugActivo = !!estado.debug?.activo;

  const preguntasAcertadasGlobal = Array.isArray(estado.preguntas?.acertadasIds)
    ? estado.preguntas.acertadasIds
    : [];

  const puntajeCombateActual = Math.floor(Number(estado.puntaje?.combateActual ?? 0));
  const puntajeTotal = Math.floor(Number(estado.puntaje?.total ?? 0));

  const vidasJugador = Number.isFinite(estado.jugador?.vida) ? estado.jugador.vida : 0;
  const escudosJugador = Number.isFinite(estado.jugador?.escudos) ? estado.jugador.escudos : 0;

  const initRef = useRef(false);
  const [vidasRival, setVidasRival] = useState(1);
  const [escudosRival, setEscudosRival] = useState(0);

  const [turno, setTurno] = useState("JUGADOR");
  const [fase, setFase] = useState("MENU");

  const [finResultado, setFinResultado] = useState(null);
  const finProcesadoRef = useRef(false);

  const [auraNivel, setAuraNivel] = useState(0);
  const [tierRonda, setTierRonda] = useState(baseTier);

  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

  const [feedbackTitulo, setFeedbackTitulo] = useState("");
  const [feedbackTexto, setFeedbackTexto] = useState("");
  const [finMensaje, setFinMensaje] = useState("");

  const [modoPregunta, setModoPregunta] = useState("ATAQUE");

  const estiloBotonBase = useMemo(
    () => ({
      width: 270,
      height: 216,
      position: "relative",
      display: "block",
      padding: 0,
      transition: "transform 0.15s ease-out",
      transform: "scale(1)",
      transformOrigin: "center",
    }),
    []
  );

  const onHoverScale = useCallback((ev, scale) => {
    if (!ev?.currentTarget) return;
    ev.currentTarget.style.transform = `scale(${scale})`;
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    puntajeResetCombate?.();

    const cfg = ENEMIGOS_POR_TIER[baseTier] ?? ENEMIGOS_POR_TIER[1];

    let esc = 0;
    if (Number.isFinite(Number(rivalEscudosProp))) {
      esc = Math.max(0, Math.floor(Number(rivalEscudosProp)));
    } else {
      esc = Number(cfg.escudosPorDefecto || 0);
      const prob = Number(cfg.probEscudosAdicionales || 0);
      const add = Number(cfg.escudosAdicionales || 0);
      if (prob > 0 && Math.random() < prob) esc += add;
      esc = Math.max(0, Math.floor(esc));
    }

    let v = 1;
    if (Number.isFinite(Number(rivalVidasProp))) {
      v = Math.max(1, Math.floor(Number(rivalVidasProp)));
    } else {
      v = Math.max(1, Math.floor(Number(cfg.vidas || 1)));
    }

    setVidasRival(v);
    setEscudosRival(esc);

    setTurno("JUGADOR");
    setFase("MENU");

    setAuraNivel(0);
    setTierRonda(baseTier);

    setPreguntasVistas([]);
    setPreguntaActual(null);
    setOpcionSeleccionada(null);

    setFeedbackTitulo("");
    setFeedbackTexto("");
    setFinMensaje("");

    setFinResultado(null);
    finProcesadoRef.current = false;
  }, [baseTier, rivalVidasProp, rivalEscudosProp, puntajeResetCombate]);

  useEffect(() => {
    if (fase === "FIN") return;

    if (vidasJugador <= 0) {
      setTurno("FIN");
      setFase("FIN");
      setFinResultado("LOSE");
      setFinMensaje("Has perdido: tus vidas llegaron a 0.");
      return;
    }
    if (vidasRival <= 0) {
      setTurno("FIN");
      setFase("FIN");
      setFinResultado("WIN");
      setFinMensaje(`¡Ganaste! ${rivalNombre} se quedó sin vidas.`);
      return;
    }
  }, [vidasJugador, vidasRival, fase, rivalNombre]);

  const cargarPregunta = useCallback(
    (tierParaPregunta, modo) => {
      const bancoRaw = getBancoPorTier(tierParaPregunta);
      const banco = bancoRaw.filter((q) => !preguntasAcertadasGlobal.includes(String(q.id)));

      if (!banco.length) {
        setModoPregunta(modo);
        setPreguntaActual(null);
        setOpcionSeleccionada(null);
        setFase("PREGUNTA");
        return;
      }

      const poolSinVistas = banco.filter((q) => !preguntasVistas.includes(q.id));
      const seleccion = pickRandom(poolSinVistas.length ? poolSinVistas : banco);
      if (!seleccion) return;

      setModoPregunta(modo);
      setPreguntaActual(seleccion);
      setOpcionSeleccionada(null);

      setPreguntasVistas((prev) => (prev.includes(seleccion.id) ? prev : [...prev, seleccion.id]));
      setFase("PREGUNTA");
    },
    [preguntasVistas, preguntasAcertadasGlobal]
  );

  const escudosRivalRef = useRef(0);
  useEffect(() => {
    escudosRivalRef.current = escudosRival;
  }, [escudosRival]);

  const aplicarGolpeRival = useCallback((danio) => {
    const d = Math.max(1, Number(danio || 1));
    if (escudosRivalRef.current > 0) {
      setEscudosRival((e) => Math.max(0, e - 1));
      return;
    }
    setVidasRival((v) => Math.max(0, v - d));
  }, []);

  const reglasAuraActual = useMemo(() => getAuraReglas(auraNivel), [auraNivel]);
  const reglasAuraSiguiente = useMemo(() => getAuraReglas(auraNivel + 1), [auraNivel]);

  const tierRondaSiAtaco = useMemo(
    () => clampTier(baseTier + (reglasAuraActual.tierBonus || 0)),
    [baseTier, reglasAuraActual]
  );
  const tierRondaSiSuboAura = useMemo(
    () => clampTier(baseTier + (reglasAuraSiguiente.tierBonus || 0)),
    [baseTier, reglasAuraSiguiente]
  );

  const onAtacar = useCallback(() => {
    const tRonda = tierRondaSiAtaco;
    setTierRonda(tRonda);
    setTurno("JUGADOR");
    cargarPregunta(tRonda, "ATAQUE");
  }, [cargarPregunta, tierRondaSiAtaco]);

  const onAumentarAura = useCallback(() => {
    setAuraNivel((prev) => prev + 1);
    const tRonda = tierRondaSiSuboAura;
    setTierRonda(tRonda);
    setTurno("RIVAL");
    cargarPregunta(tRonda, "DEFENSA");
  }, [cargarPregunta, tierRondaSiSuboAura]);

  const onHuir = useCallback(() => {
    setTurno("FIN");
    setFase("FIN");
    setFinResultado("FLEE");
    setFinMensaje("Has huido del combate.");
  }, []);

  const resolverRespuesta = useCallback(() => {
    if (!preguntaActual) return;
    if (opcionSeleccionada === null) return;

    const correcta = opcionSeleccionada === preguntaActual.respuesta;

    setFeedbackTitulo(correcta ? "CORRECTO" : "INCORRECTO");
    setFeedbackTexto(
      correcta ? preguntaActual.feedbackOk ?? "Respuesta correcta." : preguntaActual.feedbackFail ?? "Respuesta incorrecta."
    );

    const puntosTurno = Math.max(1, Math.floor(Number(reglasAuraActual.atkMult || 1)));
    puntajeAplicarTurno?.({ puntos: puntosTurno, correcto: !!correcta });

    if (correcta) preguntaMarcarAcertada?.(preguntaActual.id);
    else setAuraNivel(0);

    if (modoPregunta === "ATAQUE") {
      if (correcta) {
        const mult = Math.max(1, Number(reglasAuraActual.atkMult || 1));
        aplicarGolpeRival(1 * mult);
      }
    }

    if (modoPregunta === "DEFENSA") {
      if (!correcta) {
        const mult = Math.max(1, Number(reglasAuraActual.defFailMult || 1));
        jugadorRecibirDanio(danioPerderBase * mult);
      }
    }

    setFase("FEEDBACK");
  }, [
    preguntaActual,
    opcionSeleccionada,
    modoPregunta,
    reglasAuraActual,
    aplicarGolpeRival,
    jugadorRecibirDanio,
    danioPerderBase,
    puntajeAplicarTurno,
    preguntaMarcarAcertada,
  ]);

  useEffect(() => {
    if (fase !== "PREGUNTA") return;

    const handler = (ev) => {
      const tag = (ev.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const k = String(ev.key || "").toUpperCase();
      let idx = null;

      const pos = TECLAS_OPCION.indexOf(k);
      if (pos !== -1) idx = pos;

      if (idx === null) {
        if (k === "1") idx = 0;
        else if (k === "2") idx = 1;
        else if (k === "3") idx = 2;
        else if (k === "4") idx = 3;
      }

      if (idx === null) return;
      if (!preguntaActual?.opciones?.length) return;
      if (idx < 0 || idx >= preguntaActual.opciones.length) return;

      ev.preventDefault();

      if (opcionSeleccionada === idx) {
        resolverRespuesta();
        return;
      }
      setOpcionSeleccionada(idx);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fase, preguntaActual, opcionSeleccionada, resolverRespuesta]);

  useEffect(() => {
    if (fase !== "FEEDBACK") return;

    const t = window.setTimeout(() => {
      if (vidasJugador <= 0 || vidasRival <= 0) return;

      setFeedbackTitulo("");
      setFeedbackTexto("");
      setPreguntaActual(null);
      setOpcionSeleccionada(null);

      if (modoPregunta === "ATAQUE") {
        setTurno("RIVAL");
        cargarPregunta(tierRonda, "DEFENSA");
        return;
      }

      setTurno("JUGADOR");
      setFase("MENU");
      setTierRonda(baseTier);
    }, Math.max(0, Number(feedbackDelayMs || 0)));

    return () => window.clearTimeout(t);
  }, [fase, feedbackDelayMs, modoPregunta, vidasJugador, vidasRival, cargarPregunta, tierRonda, baseTier]);

  useEffect(() => {
    if (fase !== "FIN") return;
    if (finProcesadoRef.current) return;
    finProcesadoRef.current = true;

    if (finResultado === "WIN") {
      puntajeCerrarCombateYSumarTotal?.();
      if (origenZonaId) derrotarEnemigo(origenZonaId);
      return;
    }
    puntajeDescartarCombate?.();
  }, [fase, finResultado, puntajeCerrarCombateYSumarTotal, puntajeDescartarCombate, origenZonaId, derrotarEnemigo]);

  const salir = useCallback(() => cerrarPlantilla(), [cerrarPlantilla]);

  const textoTurno = useMemo(() => {
    if (fase === "FIN") return "COMBATE FINALIZADO";
    if (turno === "JUGADOR") return "TU TURNO (ATAQUE)";
    return "TURNO RIVAL (DEFENSA)";
  }, [turno, fase]);

  const getClaseOpcion = useCallback(
    (idx) => {
      if (!preguntaActual) return "pixel-ui2 combate-option";
      const selected = opcionSeleccionada === idx;
      const isCorrect = idx === preguntaActual.respuesta;

      if (debugActivo) {
        return `pixel-ui2 combate-option ${isCorrect ? "combate-option--debug-ok" : "combate-option--debug-fail"}`;
      }

      return `pixel-ui2 combate-option ${selected ? "combate-option--selected" : ""}`.trim();
    },
    [preguntaActual, opcionSeleccionada, debugActivo]
  );

  // Sprites (100x100, si quieres ahora)
  const jugadorAspecto = estado.jugador?.aspecto || "DEFAULT";
  const srcJugador = useMemo(() => selectorDeAspecto(jugadorAspecto, "idle"), [jugadorAspecto]);
  const animRival = useMemo(() => (fase === "FIN" && finResultado === "WIN" ? "derrotado" : "idle"), [fase, finResultado]);
  const srcRival = useMemo(() => selectorDeRival(rivalFamilia, baseTier, animRival), [rivalFamilia, baseTier, animRival]);

  return (
    <div className="pixel-ui2 combate-overlay">
      <div
        className="pixel-ui2 combate-panel"
        style={{
          backgroundImage: `url(${bgPanel})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* BATTLEFIELD */}
        <div className="pixel-ui2 combate-battlefield">
          <div className="pixel-ui2 combate-header">
            <div className="pixel-ui2 combate-col">
              <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85 }}>
                JUGADOR
              </div>
              <div className="pixel-ui2" style={{ fontSize: 14, fontWeight: 800 }}>
                Vidas: {vidasJugador} | Escudos: {escudosJugador}
              </div>

              <div className="pixel-ui2 combate-points">Puntos (combate): {puntajeCombateActual}</div>
              <div className="pixel-ui2 combate-points-total">Total: {puntajeTotal}</div>
            </div>

            <div className="pixel-ui2 combate-center">
              <div className="pixel-ui2 combate-title">{titulo}</div>
              <div className="pixel-ui2 combate-subtitle">
                {textoTurno} • Rival: {rivalNombre} • Tier rival: {baseTier} • Aura: {auraNivel}{" "}
                {auraNivel > 0 ? `(Atk x${reglasAuraActual.atkMult} / FailDef x${reglasAuraActual.defFailMult})` : ""}
                {debugActivo ? " • DEBUG ON" : ""}
              </div>
              <div className="pixel-ui2 combate-description">{texto}</div>
            </div>

            <div className="pixel-ui2 combate-col combate-col--right">
              <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85 }}>
                {rivalNombre.toUpperCase()}
              </div>
              <div className="pixel-ui2" style={{ fontSize: 14, fontWeight: 800 }}>
                Vidas: {vidasRival} | Escudos: {escudosRival}
              </div>
            </div>
          </div>

          <div className="bt-player in-battle">
            {srcJugador ? (
              <img src={srcJugador} alt="" draggable={false} className="combat-sprite" />
            ) : (
              <div className="combat-sprite-fallback combat-sprite-fallback--player" />
            )}
          </div>

          <div className="bt-rival in-battle">
            {srcRival ? (
              <img src={srcRival} alt="" draggable={false} className="combat-sprite combat-sprite--flip" />
            ) : (
              <div className="combat-sprite-fallback combat-sprite-fallback--rival" />
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pixel-ui2 combate-actions">
          {/* FIN */}
          {fase === "FIN" && (
            <>
              <div className="pixel-ui2" style={{ fontSize: 16, fontWeight: 900 }}>
                {finMensaje || "Combate finalizado."}
              </div>

              <div className="pixel-ui2" style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                {finResultado === "WIN"
                  ? "✅ Los puntos del combate se acumularon al total."
                  : "❌ Los puntos del combate fueron descartados."}
              </div>

              <div className="pixel-ui2 combate-btn-row">
                <button className="pixel-ui2 combate-btn combate-btn-wide" onClick={salir}>
                  Salir
                </button>
              </div>
            </>
          )}

          {/* MENU */}
          {fase === "MENU" && turno === "JUGADOR" && (
            <>
              <div className="pixel-ui2 combate-top-title">
                <h2>Elige una acción:</h2>
              </div>

              <div className="pixel-ui2 combate-menu-row">
                <button
                  className="pixel-ui2 combate-btn"
                  onClick={onAtacar}
                  style={estiloBotonBase}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub">
                    Tier ronda: {tierRondaSiAtaco}
                    {auraNivel > 0 ? ` • Golpe x${reglasAuraActual.atkMult}` : ""}
                  </div>
                  <div className="pixel-ui2 combate-btn-title">Iniciar Ataque</div>
                </button>

                <button
                  className="pixel-ui2 combate-btn combate-btn--aura"
                  onClick={onAumentarAura}
                  style={estiloBotonBase}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub">Aura: {auraNivel} ▶ {auraNivel + 1}</div>
                  <div className="pixel-ui2 combate-btn-title">Aura</div>
                </button>

                <button
                  className="pixel-ui2 combate-btn combate-btn--disabled"
                  disabled
                  style={{ ...estiloBotonBase, cursor: "not-allowed" }}
                >
                  <div className="pixel-ui2 combate-btn-sub">(Próximamente)</div>
                  <div className="pixel-ui2 combate-btn-title">Inventario</div>
                </button>

                <button
                  className="pixel-ui2 combate-btn combate-btn--flee"
                  onClick={onHuir}
                  style={estiloBotonBase}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub">Abandonas el combate</div>
                  <div className="pixel-ui2 combate-btn-title">Huir</div>
                </button>
              </div>
            </>
          )}

          {/* PREGUNTA */}
          {fase === "PREGUNTA" && (
            <>
              {preguntaActual ? (
                <>
                  <div className="pixel-ui2 combate-question">
                    <h2>{preguntaActual.pregunta}</h2>
                  </div>

                  <div className="pixel-ui2 combate-options">
                    {preguntaActual.opciones.map((op, idx) => {
                      const sigla = TECLAS_OPCION[idx] ?? "?";
                      return (
                        <button key={idx} className={getClaseOpcion(idx)} onClick={() => setOpcionSeleccionada(idx)}>
                          <div className="pixel-ui2 combate-option-inner">
                            <div className="pixel-ui2 combate-option-letter">{sigla}:</div>
                            <div className="pixel-ui2 combate-option-text">
                              <p className="text-options">{op}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pixel-ui2 combate-btn-row">
                    <button
                      className={`pixel-ui2 combate-btn combate-btn-wide ${
                        opcionSeleccionada === null ? "combate-btn--disabled" : ""
                      }`}
                      onClick={resolverRespuesta}
                      disabled={opcionSeleccionada === null}
                    >
                      Confirmar
                    </button>
                  </div>
                </>
              ) : (
                <div className="pixel-ui2" style={{ opacity: 0.85 }}>
                  No hay preguntas disponibles (todas las de este tier ya fueron acertadas globalmente).
                </div>
              )}
            </>
          )}

          {/* FEEDBACK */}
          {fase === "FEEDBACK" && (
            <>
              <div className="pixel-ui2" style={{ fontSize: 18, fontWeight: 1000, marginBottom: 8 }}>
                {feedbackTitulo}
              </div>
              <div className="pixel-ui2" style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.35 }}>
                {feedbackTexto}
              </div>
              <div className="pixel-ui2" style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Siguiente turno en {Math.round(Math.max(0, feedbackDelayMs) / 100) / 10}s…
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
