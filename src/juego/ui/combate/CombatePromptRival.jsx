// src/ui/combate/CombatePromptRival.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import test from "./../test/listadoTest.js"; // ajusta la ruta si cambia
import "./CombatePromptRival.css";

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

const TECLAS_OPCION = ["S", "E", "N", "A"]; // indices 0..3

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

    // ✅ puntaje
    puntajeResetCombate,
    puntajeAplicarTurno,
    puntajeDescartarCombate,
    puntajeCerrarCombateYSumarTotal,

    // ✅ preguntas globales
    preguntaMarcarAcertada,
  } = useAccionesJuego();

  const plantilla = estado.ui?.plantillaActiva;
  if (!plantilla || plantilla.id !== "COMBATE_RIVAL") return null;

  const origenZonaId = plantilla.origenZonaId;
  const props = plantilla.props || {};

  const titulo = props.titulo ?? "COMBATE";
  const texto = props.texto ?? "Combate por turnos.";
  const baseTier = clampTier(props.tier ?? 1);
  const danioPerderBase = Number.isFinite(props.danioPerder) ? props.danioPerder : 1;
  const feedbackDelayMs = Number.isFinite(props.feedbackDelayMs) ? props.feedbackDelayMs : 2000;

  const debugActivo = !!estado.debug?.activo;

  // ✅ Global: preguntas acertadas (no se repiten en todo el mundo)
  const preguntasAcertadasGlobal = Array.isArray(estado.preguntas?.acertadasIds)
    ? estado.preguntas.acertadasIds
    : [];

  // ✅ Global: puntajes
  const puntajeCombateActual = Math.floor(Number(estado.puntaje?.combateActual ?? 0));
  const puntajeTotal = Math.floor(Number(estado.puntaje?.total ?? 0));

  // ===== Jugador (global) =====
  const vidasJugador = Number.isFinite(estado.jugador?.vida) ? estado.jugador.vida : 0;
  const escudosJugador = Number.isFinite(estado.jugador?.escudos) ? estado.jugador.escudos : 0;

  // ===== Rival (local) =====
  const initRef = useRef(false);
  const [vidasRival, setVidasRival] = useState(1);
  const [escudosRival, setEscudosRival] = useState(0);

  // ===== Turnos/Fases =====
  const [turno, setTurno] = useState("JUGADOR"); // JUGADOR | RIVAL | FIN
  const [fase, setFase] = useState("MENU"); // MENU | PREGUNTA | FEEDBACK | FIN

  // ===== Resultado FIN =====
  const [finResultado, setFinResultado] = useState(null); // "WIN" | "LOSE" | "FLEE" | null
  const finProcesadoRef = useRef(false);

  // ===== Aura / Tier ronda =====
  const [auraNivel, setAuraNivel] = useState(0);
  const [tierRonda, setTierRonda] = useState(baseTier);

  // ===== Preguntas =====
  const [preguntasVistas, setPreguntasVistas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);

  const [feedbackTitulo, setFeedbackTitulo] = useState("");
  const [feedbackTexto, setFeedbackTexto] = useState("");
  const [finMensaje, setFinMensaje] = useState("");

  const [modoPregunta, setModoPregunta] = useState("ATAQUE"); // ATAQUE | DEFENSA

  // ===== Init =====
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // ✅ reset puntaje del combate al iniciar
    puntajeResetCombate?.();

    const cfg = ENEMIGOS_POR_TIER[baseTier] ?? ENEMIGOS_POR_TIER[1];
    let esc = Number(cfg.escudosPorDefecto || 0);
    const prob = Number(cfg.probEscudosAdicionales || 0);
    const add = Number(cfg.escudosAdicionales || 0);
    if (prob > 0 && Math.random() < prob) esc += add;

    setVidasRival(Math.max(1, Number(cfg.vidas || 1)));
    setEscudosRival(Math.max(0, esc));

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
  }, [baseTier, puntajeResetCombate]);

  // ===== Fin automático =====
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
      setFinMensaje("¡Ganaste! El rival se quedó sin vidas.");
      return;
    }
  }, [vidasJugador, vidasRival, fase]);

  // ===== Cargar pregunta (filtra global acertadas) =====
  const cargarPregunta = useCallback(
    (tierParaPregunta, modo) => {
      const bancoRaw = getBancoPorTier(tierParaPregunta);

      // ✅ nunca traer preguntas globalmente acertadas
      const banco = bancoRaw.filter((q) => !preguntasAcertadasGlobal.includes(String(q.id)));

      if (!banco.length) {
        setModoPregunta(modo);
        setPreguntaActual(null);
        setOpcionSeleccionada(null);
        setFase("PREGUNTA");
        return;
      }

      // primero intenta no repetir dentro del combate
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

  // ===== Daño rival (escudo primero) =====
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

  // ===== Menú (jugador) =====
  const reglasAuraActual = useMemo(() => getAuraReglas(auraNivel), [auraNivel]);
  const reglasAuraSiguiente = useMemo(() => getAuraReglas(auraNivel + 1), [auraNivel]);

  const tierRondaSiAtaco = useMemo(() => clampTier(baseTier + (reglasAuraActual.tierBonus || 0)), [baseTier, reglasAuraActual]);
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

  // ===== Resolver respuesta =====
  const resolverRespuesta = useCallback(() => {
    if (!preguntaActual) return;
    if (opcionSeleccionada === null) return;

    const correcta = opcionSeleccionada === preguntaActual.respuesta;

    setFeedbackTitulo(correcta ? "CORRECTO" : "INCORRECTO");
    setFeedbackTexto(correcta ? preguntaActual.feedbackOk ?? "Respuesta correcta." : preguntaActual.feedbackFail ?? "Respuesta incorrecta.");

    // ✅ puntaje por turno usando atkMult (aura)
    const puntosTurno = Math.max(1, Math.floor(Number(reglasAuraActual.atkMult || 1)));
    puntajeAplicarTurno?.({ puntos: puntosTurno, correcto: !!correcta });

    // ✅ si acierta: marcar global (no repetir en el mundo)
    if (correcta) {
      preguntaMarcarAcertada?.(preguntaActual.id);
    } else {
      // ✅ si falla: aura vuelve a 0
      setAuraNivel(0);
    }

    // ===== Lógica combate =====
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

  // ===== Teclado (S/E/N/A y 1/2/3/4) =====
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

      // doble tecla (misma selección) => confirma
      if (opcionSeleccionada === idx) {
        resolverRespuesta();
        return;
      }

      // cambio => solo selecciona
      setOpcionSeleccionada(idx);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fase, preguntaActual, opcionSeleccionada, resolverRespuesta]);

  // ===== Auto-advance tras feedback =====
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

  // ===== Procesar FIN (1 sola vez) =====
  useEffect(() => {
    if (fase !== "FIN") return;
    if (finProcesadoRef.current) return;
    finProcesadoRef.current = true;

    // ✅ reglas:
    // - WIN: suma combateActual al total
    // - LOSE: descarta combateActual
    // - FLEE: descarta combateActual
    if (finResultado === "WIN") {
      puntajeCerrarCombateYSumarTotal?.();
      if (origenZonaId) derrotarEnemigo(origenZonaId);
      return;
    }

    // LOSE o FLEE => descartar
    puntajeDescartarCombate?.();
  }, [fase, finResultado, puntajeCerrarCombateYSumarTotal, puntajeDescartarCombate, origenZonaId, derrotarEnemigo]);

  // ===== Salir =====
  const salir = useCallback(() => {
    cerrarPlantilla();
  }, [cerrarPlantilla]);

  // ===== UI helpers =====
  const textoTurno = useMemo(() => {
    if (fase === "FIN") return "COMBATE FINALIZADO";
    if (turno === "JUGADOR") return "TU TURNO (ATAQUE)";
    return "TURNO RIVAL (DEFENSA)";
  }, [turno, fase]);

  const tierVisibleEnPregunta = useMemo(() => clampTier(tierRonda), [tierRonda]);

  // ===== Helpers clases opciones =====
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

  return (
    <div className="pixel-ui2 combate-overlay">
      <div className="pixel-ui2 combate-panel">
        {/* 1) Header / Estados */}
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
              {textoTurno} • Tier rival: {baseTier} • Aura: {auraNivel}{" "}
              {auraNivel > 0 ? `(Atk x${reglasAuraActual.atkMult} / FailDef x${reglasAuraActual.defFailMult})` : ""}
              {debugActivo ? " • DEBUG ON" : ""}
            </div>
            <div className="pixel-ui2 combate-description">{texto}</div>
          </div>

          <div className="pixel-ui2 combate-col combate-col--right">
            <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85 }}>
              RIVAL
            </div>
            <div className="pixel-ui2" style={{ fontSize: 14, fontWeight: 800 }}>
              Vidas: {vidasRival} | Escudos: {escudosRival}
            </div>
          </div>
        </div>

        {/* 2) Campo de batalla */}
        <div className="pixel-ui2 combate-battlefield">
          <div className="pixel-ui2 combate-battle-side" style={{ textAlign: "left" }}>
            <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85 }}>
              TU LADO
            </div>
            <div className="pixel-ui2" style={{ marginTop: 6, fontSize: 14, opacity: 0.95 }}>
              (Animación Jugador)
            </div>
          </div>

          <div className="pixel-ui2 combate-battle-vs">VS</div>

          <div className="pixel-ui2 combate-battle-side" style={{ textAlign: "right" }}>
            <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85 }}>
              LADO RIVAL
            </div>
            <div className="pixel-ui2" style={{ marginTop: 6, fontSize: 14, opacity: 0.95 }}>
              (Animación Rival)
            </div>
          </div>
        </div>

        {/* 3) Acciones / Preguntas */}
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
              <div className="pixel-ui2" style={{ fontSize: 13, opacity: 0.92, marginBottom: 10 }}>
                Elige una acción:
              </div>

              <div className="pixel-ui2 combate-grid-2">
                <button className="pixel-ui2 combate-btn" onClick={onAtacar}>
                  Atacar
                  <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 600 }}>
                    Tier ronda: {tierRondaSiAtaco}
                    {auraNivel > 0 ? ` • Golpe x${reglasAuraActual.atkMult}` : ""}
                  </div>
                </button>

                <button className="pixel-ui2 combate-btn combate-btn--aura" onClick={onAumentarAura}>
                  Aumentar Aura
                  <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.88, marginTop: 4, fontWeight: 700 }}>
                    Aura: {auraNivel} ▶ {auraNivel + 1}
                  </div>
                  <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>
                    Tier: {tierRondaSiAtaco} ▶ {tierRondaSiSuboAura} • (Saltas ataque)
                  </div>
                </button>

                <button className="pixel-ui2 combate-btn combate-btn--disabled" disabled>
                  Inventario
                  <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.75, marginTop: 4, fontWeight: 600 }}>
                    (Próximamente)
                  </div>
                </button>

                <button className="pixel-ui2 combate-btn combate-btn--flee" onClick={onHuir}>
                  Huir
                  <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 600 }}>
                    Abandonas el combate (descarta puntos).
                  </div>
                </button>
              </div>
            </>
          )}

          {/* PREGUNTA */}
          {fase === "PREGUNTA" && (
            <>
              <div className="pixel-ui2" style={{ fontSize: 13, opacity: 0.92, marginBottom: 8 }}>
                {modoPregunta === "ATAQUE"
                  ? `ATAQUE • Tier actual: ${tierVisibleEnPregunta} • Si aciertas golpeas${
                      auraNivel > 0 ? ` x${reglasAuraActual.atkMult}` : ""
                    }.`
                  : `DEFENSA • Tier actual: ${tierVisibleEnPregunta} • Si fallas recibes daño${
                      auraNivel > 0 ? ` x${reglasAuraActual.defFailMult}` : ""
                    }.`}
              </div>

              {preguntaActual ? (
                <>
                  <div className="pixel-ui2" style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.35 }}>
                    {preguntaActual.pregunta}
                  </div>

                  <div className="pixel-ui2 combate-options">
                    {preguntaActual.opciones.map((op, idx) => {
                      const sigla = TECLAS_OPCION[idx] ?? "?";

                      return (
                        <button key={idx} className={getClaseOpcion(idx)} onClick={() => setOpcionSeleccionada(idx)}>
                          <div className="pixel-ui2 combate-option-inner">
                            <div className="pixel-ui2 combate-option-letter">{sigla}:</div>
                            <div className="pixel-ui2 combate-option-text">{op}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pixel-ui2 combate-btn-row">
                    <button
                      className={`pixel-ui2 combate-btn combate-btn-wide ${opcionSeleccionada === null ? "combate-btn--disabled" : ""}`}
                      onClick={resolverRespuesta}
                      disabled={opcionSeleccionada === null}
                    >
                      Confirmar
                    </button>

                    <button className="pixel-ui2 combate-btn combate-btn--flee" onClick={onHuir} style={{ minWidth: 120 }}>
                      Huir
                    </button>
                  </div>

                  <div className="pixel-ui2 combate-hint">
                    Atajos: S/E/N/A o 1/2/3/4 • Presiona la misma tecla dos veces para confirmar
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
