// src/ui/combate/CombatePromptRival.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import test from "./../test/listadoTest.js";
import "./CombatePromptRival.css";

// ✅ selectores de skins
import { selectorDeAspecto, selectorDeRival } from "../../../estado/selectorDeAspecto.jsx";

// ✅ Fondo del PANEL
import bgPanel from "../../../assets/fondos/bgPanel.png";

// ✅ ICONOS HUD (evitar conflictos)
import corazonLlenoHUD from "../../../assets/ui/corazones/Corazon.svg";
import corazonMitadHUD from "../../../assets/ui/corazones/CorazonMitad.svg";
import corazonVacioHUD from "../../../assets/ui/corazones/CorazonVacio.svg";
import escudoImgHUD from "../../../assets/ui/escudos/Escudos.svg";

// ✅ Marco retrato
import marcoHUD from "../../../assets/ui/marcos/marcoDePiedra.svg";

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

// ✅ debe coincidir con tu CSS (1.5s)
const ATTACK_ANIM_MS = 1500;

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
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

function buildCorazones(vidaActual, vidaMax, heartsCount) {
  const max = Math.max(1, Number(vidaMax ?? 1));
  const vidaNorm = clamp(Number(vidaActual ?? 0), 0, max);
  const count = Math.max(1, Number(heartsCount ?? 3));

  return Array.from({ length: count }, (_, i) => {
    const restante = vidaNorm - i * 2;
    if (restante >= 2) return { tipo: "lleno", src: corazonLlenoHUD };
    if (restante === 1) return { tipo: "mitad", src: corazonMitadHUD };
    return { tipo: "vacio", src: corazonVacioHUD };
  });
}

export default function CombatePromptRival() {
  const estado = useEstadoJuego();
  const acciones = useAccionesJuego();

  const plantilla = estado.ui?.plantillaActiva;
  const combateActivo = !!plantilla && plantilla.id === "COMBATE_RIVAL";

  const origenZonaId = combateActivo ? plantilla.origenZonaId : null;
  const props = combateActivo ? plantilla.props || {} : {};

  const rivalNombre = String(props.rivalNombre ?? "").trim() || "RIVAL";
  const rivalTierProp = props.rivalTier ?? props.tier ?? 1;
  const rivalEscudosProp = props.rivalEscudos;
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

  // Jugador
  const vidasJugador = Number.isFinite(estado.jugador?.vida) ? estado.jugador.vida : 0;
  const escudosJugador = Number.isFinite(estado.jugador?.escudos) ? estado.jugador.escudos : 0;
  const nombreJugador = String(estado.jugador?.nombre ?? "").trim() || "JUGADOR";
  const jugadorAspecto = estado.jugador?.aspecto || "DEFAULT";

  // States
  const [vidasRival, setVidasRival] = useState(1);
  const [vidasRivalMax, setVidasRivalMax] = useState(1);
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

  // ✅ candado visual
  const [animGolpeEnCurso, setAnimGolpeEnCurso] = useState(false);

  // ✅ NUEVO: si el golpe es LETAL, programamos el FIN desde resolverRespuesta
  const pendingFinRef = useRef(null); // { tipo: "WIN"|"LOSE", mensaje: string, timeoutId: number|null }

  const combateKey = useMemo(() => {
    return [
      String(origenZonaId ?? ""),
      rivalNombre,
      String(baseTier),
      String(rivalEscudosProp ?? ""),
      rivalFamilia,
    ].join("|");
  }, [origenZonaId, rivalNombre, baseTier, rivalEscudosProp, rivalFamilia]);

  const onHoverScale = useCallback((ev, scale) => {
    if (!ev?.currentTarget) return;
    ev.currentTarget.style.transform = `scale(${scale})`;
  }, []);

  // ✅ Inicialización
  useEffect(() => {
    if (!combateActivo) return;

    acciones?.puntajeResetCombate?.();

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

    const v = Math.max(1, Math.floor(Number(cfg.vidas || 1)));

    setVidasRival(v);
    setVidasRivalMax(v);
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

    setAnimGolpeEnCurso(false);

    // limpiar fin pendiente anterior
    if (pendingFinRef.current?.timeoutId) window.clearTimeout(pendingFinRef.current.timeoutId);
    pendingFinRef.current = null;
  }, [combateActivo, combateKey, baseTier, rivalEscudosProp, acciones]);

  // refs para escudos rival
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

  // ✅ si entramos a FEEDBACK, activamos “golpe en curso”
  useEffect(() => {
    if (!combateActivo) return;

    if (fase !== "FEEDBACK") {
      setAnimGolpeEnCurso(false);
      return;
    }

    setAnimGolpeEnCurso(true);
    const t = window.setTimeout(() => setAnimGolpeEnCurso(false), ATTACK_ANIM_MS);
    return () => window.clearTimeout(t);
  }, [combateActivo, fase]);

  // ✅ FIN automático (pero NO si hay FIN programado por golpe letal, ni si el golpe está corriendo)
  useEffect(() => {
    if (!combateActivo) return;
    if (fase === "FIN") return;

    // si resolverRespuesta ya programó un FIN (para mostrar el último dash), no interferimos
    if (pendingFinRef.current) return;

    // si estamos en FEEDBACK y el dash está corriendo, no cortamos
    if (fase === "FEEDBACK" && animGolpeEnCurso) return;

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
  }, [combateActivo, vidasJugador, vidasRival, fase, rivalNombre, animGolpeEnCurso]);

  const cargarPregunta = useCallback(
    (tierParaPregunta, modo) => {
      if (!combateActivo) return;

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
    [combateActivo, preguntasVistas, preguntasAcertadasGlobal]
  );

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

  // ✅ helper: programa fin después del dash final
  const programarFin = useCallback((tipo, mensaje) => {
    // limpiar si existía
    if (pendingFinRef.current?.timeoutId) window.clearTimeout(pendingFinRef.current.timeoutId);

    const timeoutId = window.setTimeout(() => {
      setTurno("FIN");
      setFase("FIN");
      setFinResultado(tipo);
      setFinMensaje(mensaje);
      pendingFinRef.current = null;
    }, ATTACK_ANIM_MS);

    pendingFinRef.current = { tipo, mensaje, timeoutId };
  }, []);

  const resolverRespuesta = useCallback(() => {
    if (!combateActivo) return;
    if (!preguntaActual) return;
    if (opcionSeleccionada === null) return;

    const correcta = opcionSeleccionada === preguntaActual.respuesta;

    setFeedbackTitulo(correcta ? "CORRECTO" : "INCORRECTO");
    setFeedbackTexto(
      correcta
        ? preguntaActual.feedbackOk ?? "Respuesta correcta."
        : preguntaActual.feedbackFail ?? "Respuesta incorrecta."
    );

    const puntosTurno = Math.max(1, Math.floor(Number(reglasAuraActual.atkMult || 1)));
    acciones?.puntajeAplicarTurno?.({ puntos: puntosTurno, correcto: !!correcta });

    if (correcta) acciones?.preguntaMarcarAcertada?.(preguntaActual.id);
    else setAuraNivel(0);

    // ✅ PRE-CÁLCULO LETAL (para no cortar el último dash)
    let seraWin = false;
    let seraLose = false;

    if (modoPregunta === "ATAQUE") {
      if (correcta) {
        const mult = Math.max(1, Number(reglasAuraActual.atkMult || 1));

        // si hay escudo, NO baja vida (no es letal por vida)
        if (escudosRivalRef.current > 0) {
          seraWin = false;
        } else {
          const proyectado = Math.max(0, Number(vidasRival) - 1 * mult);
          if (proyectado <= 0) seraWin = true;
        }

        aplicarGolpeRival(1 * mult);
      }
    }

    if (modoPregunta === "DEFENSA") {
      if (!correcta) {
        const mult = Math.max(1, Number(reglasAuraActual.defFailMult || 1));
        const danio = danioPerderBase * mult;

        const proyectadoJugador = Math.max(0, Number(vidasJugador) - danio);
        if (proyectadoJugador <= 0) seraLose = true;

        acciones?.jugadorRecibirDanio?.(danio);
      }
    }

    // ✅ entramos a FEEDBACK sí o sí (esto dispara el dash)
    setFase("FEEDBACK");

    // ✅ si es golpe final, PROGRAMAMOS el FIN después del dash
    if (seraWin) {
      programarFin("WIN", `¡Ganaste! ${rivalNombre} se quedó sin vidas.`);
      return;
    }
    if (seraLose) {
      programarFin("LOSE", "Has perdido: tus vidas llegaron a 0.");
      return;
    }
  }, [
    combateActivo,
    preguntaActual,
    opcionSeleccionada,
    modoPregunta,
    reglasAuraActual,
    aplicarGolpeRival,
    danioPerderBase,
    acciones,
    vidasRival,
    vidasJugador,
    rivalNombre,
    programarFin,
  ]);

  // teclado opciones
  useEffect(() => {
    if (!combateActivo) return;
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
  }, [combateActivo, fase, preguntaActual, opcionSeleccionada, resolverRespuesta]);

  // ✅ avance automático tras FEEDBACK (pero NO si hay FIN programado)
  useEffect(() => {
    if (!combateActivo) return;
    if (fase !== "FEEDBACK") return;

    // si hay fin pendiente, NO avanzamos de fase (dejamos que el timeout haga FIN)
    if (pendingFinRef.current) return;

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
  }, [
    combateActivo,
    fase,
    feedbackDelayMs,
    modoPregunta,
    vidasJugador,
    vidasRival,
    cargarPregunta,
    tierRonda,
    baseTier,
  ]);

  // procesar puntaje al fin
  useEffect(() => {
    if (!combateActivo) return;
    if (fase !== "FIN") return;
    if (finProcesadoRef.current) return;
    finProcesadoRef.current = true;

    if (finResultado === "WIN") {
      acciones?.puntajeCerrarCombateYSumarTotal?.();
      if (origenZonaId) acciones?.derrotarEnemigo?.(origenZonaId);
      return;
    }
    acciones?.puntajeDescartarCombate?.();
  }, [combateActivo, fase, finResultado, origenZonaId, acciones]);

  const salir = useCallback(() => acciones?.cerrarPlantilla?.(), [acciones]);

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

  // Sprites
  const srcJugador = useMemo(() => selectorDeAspecto(jugadorAspecto, "idle"), [jugadorAspecto]);
  const animRival = useMemo(
    () => (fase === "FIN" && finResultado === "WIN" ? "derrotado" : "idle"),
    [fase, finResultado]
  );
  const srcRival = useMemo(() => selectorDeRival(rivalFamilia, baseTier, animRival), [rivalFamilia, baseTier, animRival]);

  // HUD iconos
  const corazonesJugador = useMemo(() => buildCorazones(vidasJugador, 6, 3), [vidasJugador]);
  const escudosJugadorArr = useMemo(
    () => Array.from({ length: clamp(escudosJugador, 0, 10) }, (_, i) => i),
    [escudosJugador]
  );

  const corazonesRival = useMemo(() => {
    const max = Math.max(1, Number(vidasRivalMax ?? 1));
    const count = Math.max(1, Math.ceil(max / 2));
    return buildCorazones(vidasRival, max, count);
  }, [vidasRival, vidasRivalMax]);

  const escudosRivalArr = useMemo(
    () => Array.from({ length: clamp(escudosRival, 0, 10) }, (_, i) => i),
    [escudosRival]
  );

  // estilos HUD
  const textStroke = {
    color: "#fff",
    textShadow:
      "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000",
  };

  const HUD_ICON = 18;
  const hudFilaStyle = { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 };
  const iconStyle = {
    width: HUD_ICON,
    height: HUD_ICON,
    imageRendering: "pixelated",
    userSelect: "none",
    pointerEvents: "none",
  };
  const separadorStyle = { width: 1, height: HUD_ICON, background: "rgba(255,255,255,0.25)", marginInline: 4 };

  const portraitBoxStyle = (align = "left") => ({
    width: 56,
    height: 56,
    flex: "0 0 auto",
    backgroundImage: `url(${marcoHUD})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    backgroundPosition: "center",
    display: "grid",
    placeItems: "center",
    marginRight: align === "left" ? 10 : 0,
    marginLeft: align === "right" ? 10 : 0,
  });

  const portraitViewportStyle = {
    width: 40,
    height: 40,
    overflow: "hidden",
    borderRadius: 6,
    display: "grid",
    placeItems: "center",
    background: "transparent",
  };

  const portraitImgStyle = (zoom, zx, zy) => ({
    width: 64,
    height: 64,
    imageRendering: "pixelated",
    transform: `translate(${zx}px, ${zy}px) scale(${zoom})`,
    transformOrigin: "center",
    userSelect: "none",
    pointerEvents: "none",
  });

  const zoomJugador = 1.35, zoomXJugador = 0, zoomYJugador = -4;
  const zoomRival = 1.35, zoomXRival = 0, zoomYRival = -4;

  const actionsGridStyle = useMemo(
    () => ({
      width: "100%",
      maxWidth: 1166,
      marginInline: "auto",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gridTemplateRows: "auto auto",
      gap: 18,
      alignItems: "stretch",
    }),
    []
  );

  const btnCardBase = useMemo(
    () => ({
      width: "100%",
      minHeight: 170,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      padding: 0,
      transition: "transform 0.15s ease-out",
      transform: "scale(1)",
      transformOrigin: "center",
    }),
    []
  );

  const btnFleeStyle = useMemo(
    () => ({
      gridColumn: "1 / -1",
      width: "100%",
      height: 100,
      minHeight: 100,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }),
    []
  );

  const titleStyle = useMemo(
    () => ({ fontSize: 22, fontWeight: 900, marginBottom: 24, textAlign: "center", ...textStroke }),
    [textStroke]
  );
  const subStyle = useMemo(
    () => ({ fontSize: 16, opacity: 0.95, marginBottom: 10, textAlign: "center", ...textStroke }),
    [textStroke]
  );

  if (!combateActivo) return null;

  const isFeedback = fase === "FEEDBACK";
  const playerAtaca = isFeedback && modoPregunta === "ATAQUE";
  const rivalAtaca = isFeedback && modoPregunta === "DEFENSA";

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
        <div className="pixel-ui2 combate-battlefield">
          <div className="pixel-ui2 combate-header" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
            {/* JUGADOR */}
            <div className="pixel-ui2 combate-col" style={{ display: "flex", alignItems: "flex-start", background: "transparent" }}>
              <div style={portraitBoxStyle("left")}>
                <div style={portraitViewportStyle}>
                  {srcJugador ? (
                    <img src={srcJugador} alt="" draggable={false} style={portraitImgStyle(zoomJugador, zoomXJugador, zoomYJugador)} />
                  ) : (
                    <div style={{ width: 36, height: 36, opacity: 0.3, border: "1px solid rgba(255,255,255,0.35)" }} />
                  )}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.95, ...textStroke }}>
                  {nombreJugador}
                </div>

                <div style={hudFilaStyle} aria-label="hud-jugador">
                  {corazonesJugador.map((c, idx) => (
                    <img key={`p-hp-${idx}-${c.tipo}`} src={c.src} alt={`vida-${c.tipo}`} draggable={false} style={iconStyle} />
                  ))}
                  {escudosJugadorArr.length > 0 && <div style={separadorStyle} />}
                  {escudosJugadorArr.map((i) => (
                    <img key={`p-sh-${i}`} src={escudoImgHUD} alt="escudo" draggable={false} style={iconStyle} />
                  ))}
                </div>
              </div>
            </div>

            {/* CENTRO */}
            <div className="pixel-ui2 combate-center" style={{ background: "transparent" }}>
              <div className="pixel-ui2 combate-title" style={textStroke}>
                {titulo}
              </div>
              <div className="pixel-ui2 combate-subtitle" style={{ ...textStroke, opacity: 0.95 }}>
                {textoTurno} • {rivalNombre} • Tier {baseTier} • Aura {auraNivel}
                {auraNivel > 0 ? ` (Atk x${reglasAuraActual.atkMult} / FailDef x${reglasAuraActual.defFailMult})` : ""}
                {debugActivo ? " • DEBUG ON" : ""}
              </div>
              <div className="pixel-ui2 combate-description" style={{ ...textStroke, opacity: 0.9 }}>
                {texto}
              </div>
            </div>

            {/* RIVAL */}
            <div
              className="pixel-ui2 combate-col combate-col--right"
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", background: "transparent" }}
            >
              <div style={{ minWidth: 0, textAlign: "right" }}>
                <div className="pixel-ui2" style={{ fontSize: 12, opacity: 0.95, ...textStroke }}>
                  {rivalNombre.toUpperCase()}
                </div>

                <div style={{ ...hudFilaStyle, justifyContent: "flex-end" }} aria-label="hud-rival">
                  {corazonesRival.map((c, idx) => (
                    <img key={`r-hp-${idx}-${c.tipo}`} src={c.src} alt={`vida-${c.tipo}`} draggable={false} style={iconStyle} />
                  ))}
                  {escudosRivalArr.length > 0 && <div style={separadorStyle} />}
                  {escudosRivalArr.map((i) => (
                    <img key={`r-sh-${i}`} src={escudoImgHUD} alt="escudo" draggable={false} style={iconStyle} />
                  ))}
                </div>
              </div>

              <div style={portraitBoxStyle("right")}>
                <div style={portraitViewportStyle}>
                  {srcRival ? (
                    <img src={srcRival} alt="" draggable={false} style={portraitImgStyle(zoomRival, zoomXRival, zoomYRival)} />
                  ) : (
                    <div style={{ width: 36, height: 36, opacity: 0.3, border: "1px solid rgba(255,255,255,0.35)" }} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`bt-player in-battle ${playerAtaca ? "bt-attack-player" : ""}`}>
            {srcJugador ? <img src={srcJugador} alt="" draggable={false} className="combat-sprite" /> : <div className="combat-sprite-fallback combat-sprite-fallback--player" />}
          </div>

          <div className={`bt-rival in-battle ${rivalAtaca ? "bt-attack-rival" : ""}`}>
            {srcRival ? <img src={srcRival} alt="" draggable={false} className="combat-sprite combat-sprite--flip" /> : <div className="combat-sprite-fallback combat-sprite-fallback--rival" />}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pixel-ui2 combate-actions">
          {/* FIN */}
          {fase === "FIN" && (
            <>
              <div className="pixel-ui2" style={{ fontSize: 16, fontWeight: 900, ...textStroke }}>
                {finMensaje || "Combate finalizado."}
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
              <div className="pixel-ui2 combate-top-title" style={textStroke}>
                <h2>Elige una acción:</h2>
              </div>

              <div style={actionsGridStyle}>
                <button
                  className="pixel-ui2 combate-btn"
                  onClick={onAtacar}
                  style={btnCardBase}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub" style={subStyle}>
                    Tier ronda: {tierRondaSiAtaco}
                    {auraNivel > 0 ? ` • Golpe x${reglasAuraActual.atkMult}` : ""}
                  </div>
                  <div className="pixel-ui2 combate-btn-title" style={titleStyle}>
                    Iniciar Ataque
                  </div>
                </button>

                <button
                  className="pixel-ui2 combate-btn combate-btn--aura"
                  onClick={onAumentarAura}
                  style={btnCardBase}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub" style={subStyle}>
                    Aura: {auraNivel} ▶ {auraNivel + 1}
                  </div>
                  <div className="pixel-ui2 combate-btn-title" style={titleStyle}>
                    Aura
                  </div>
                </button>

                <button className="pixel-ui2 combate-btn combate-btn--disabled" disabled style={{ ...btnCardBase, cursor: "not-allowed" }}>
                  <div className="pixel-ui2 combate-btn-sub" style={subStyle}>
                    (Próximamente)
                  </div>
                  <div className="pixel-ui2 combate-btn-title" style={titleStyle}>
                    Inventario
                  </div>
                </button>

                <button
                  className="pixel-ui2 combate-btn combate-btn--flee"
                  onClick={onHuir}
                  style={{ ...btnCardBase, ...btnFleeStyle }}
                  onMouseEnter={(e) => onHoverScale(e, 1.02)}
                  onMouseLeave={(e) => onHoverScale(e, 1)}
                >
                  <div className="pixel-ui2 combate-btn-sub" style={{ ...subStyle, marginBottom: 6 }}>
                    Abandonas el combate
                  </div>
                  <div className="pixel-ui2 combate-btn-title" style={{ ...titleStyle, marginBottom: 0 }}>
                    Huir
                  </div>
                </button>
              </div>
            </>
          )}

          {/* PREGUNTA */}
          {fase === "PREGUNTA" && (
            <>
              {preguntaActual ? (
                <>
                  <div className="pixel-ui2 combate-question" style={textStroke}>
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
                      className={`pixel-ui2 combate-btn combate-btn-wide ${opcionSeleccionada === null ? "combate-btn--disabled" : ""}`}
                      onClick={resolverRespuesta}
                      disabled={opcionSeleccionada === null}
                    >
                      Confirmar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pixel-ui2" style={{ opacity: 0.95, marginBottom: 10, ...textStroke }}>
                    No hay preguntas disponibles (todas las de este tier ya fueron acertadas globalmente).
                  </div>

                  <div className="pixel-ui2 combate-btn-row">
                    <button className="pixel-ui2 combate-btn combate-btn-wide" onClick={() => setFase("MENU")}>
                      Volver al menú
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* FEEDBACK */}
          {fase === "FEEDBACK" && (
            <>
              <div className="pixel-ui2" style={{ fontSize: 18, fontWeight: 1000, marginBottom: 8, ...textStroke }}>
                {feedbackTitulo}
              </div>
              <div className="pixel-ui2" style={{ fontSize: 14, opacity: 0.95, lineHeight: 1.35, ...textStroke }}>
                {feedbackTexto}
              </div>
              <div className="pixel-ui2" style={{ marginTop: 10, fontSize: 12, opacity: 0.9, ...textStroke }}>
                Siguiente turno en {Math.round(Math.max(0, feedbackDelayMs) / 100) / 10}s…
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
