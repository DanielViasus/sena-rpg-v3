// src/routes/scenes/sena/mainfloor/mainfloorSena.jsx
import { useEffect, useMemo } from "react";
import Mundo from "../../../juego/mundo/Mundo.jsx";
import fondo from "../../../assets/svg/fondos/demoW.png";

import Jugador from "../../../juego/entidades/jugador/Jugador.jsx";
import SistemaMoverJugador from "../../../juego/sistema/SistemaMoverJugador.jsx";

import Objeto from "../../../juego/objetos/Objeto.jsx";
import Puerta from "../../../juego/objetos/Puerta.jsx";

import TrazoRuta from "../../../juego/ui/TrazoRuta.jsx";
import IndicadorInteraccionIndirecta from "../../../juego/ui/IndicadorInteraccionIndirecta.jsx";

import Rival from "../../../juego/personajes/rival/Rival.jsx";

import puertaAbierta from "../../../assets/svg/objetos/Puertas/puertaAbierta.svg";
import puertaCerrada from "../../../assets/svg/objetos/Puertas/puertaCerrada.svg";

// +++ agrega tu icono (ajusta la ruta real)
import IconoE from "../../../assets/svg/ui/icono/pressE_128x128_400ms.gif";
import PortalSVG from "../../../assets/svg/objetos/portal/PortalSVG.svg";

// Marca de click
import MarcaClick from "../../../juego/ui/MarcaClick.jsx";
import { useMarcaClick } from "../../../juego/sistema/useMarcaClick.jsx";
import marcaClickGif from "../../../assets/svg/ui/puntero_transparente_128x128_350ms.gif";

import SistemaInteraccionIndirecta from "../../../juego/sistema/SistemaInteraccionIndirecta.jsx";
import Teleport from "../../../juego/interacciones/Teleport.jsx";

import {
  useRegistroColisiones,
  useVersionRegistroColisiones,
} from "../../../juego/colisiones/RegistroColisiones.jsx";

import { useEstadoJuego, useAccionesJuego } from "../../../estado/EstadoJuego.jsx";
import {
  crearGrillaColisiones,
  mundoAPosCelda,
  celdaAMundo,
  encontrarRutaAEstrella,
  listarCeldasLibresCercanas,
  comprimirRutaPorGiros,
} from "../../../juego/navegacion/aestrella.js";

export default function PisoDosSena() {
  const ANCHO_MUNDO = 4500;
  const LARGO_MUNDO = 3200;
  const spriteJugador = { ancho: 128, alto: 128 };
  const { jugador, navegacion, debug } = useEstadoJuego();

  const {
    establecerPosicionJugador,
    guardarInicioJugador,
    establecerRutaJugador,
    limpiarRutaJugador,
  } = useAccionesJuego();

  const registro = useRegistroColisiones();
  const versionColisiones = useVersionRegistroColisiones();
  const { marca, marcar } = useMarcaClick({ duracionMs: 300 });

  const PADDING_EXTRA_RUTA = 4;

  const obstaculos = useMemo(() => {
    const arr = [];
    for (const item of registro.values()) {
      const { rect, meta } = item;
      if (meta?.bloqueaMovimiento === false) continue;
      arr.push(rect);
    }
    return arr;
  }, [registro, versionColisiones]);

  const grilla = useMemo(() => {
    return crearGrillaColisiones({
      anchoMundo: ANCHO_MUNDO,
      largoMundo: LARGO_MUNDO,
      tamCelda: navegacion.tamCelda,
      obstaculos,
      paddingX: navegacion.paddingX + PADDING_EXTRA_RUTA,
      paddingY: navegacion.paddingY + PADDING_EXTRA_RUTA,
    });
  }, [
    ANCHO_MUNDO,
    LARGO_MUNDO,
    navegacion.tamCelda,
    navegacion.paddingX,
    navegacion.paddingY,
    obstaculos,
  ]);

  useEffect(() => {
    const xCentro = 460;
    const yCentro = 1600;
    establecerPosicionJugador(xCentro, yCentro);
    guardarInicioJugador(xCentro, yCentro);
  }, [establecerPosicionJugador, guardarInicioJugador]);

  function alClickMundo({ x, y }) {
    marcar({ x, y });

    const MAX_DIST_PX = 1500;

    const dx = x - jugador.x;
    const dy = y - jugador.y;
    const dist = Math.hypot(dx, dy);

    if (dist > MAX_DIST_PX) {
      return limpiarRutaJugador();
    }

    const maxPasosRuta = Math.ceil(MAX_DIST_PX / grilla.tamCelda) + 20;
    const maxExpansiones = maxPasosRuta * 200;
    const MAX_CANDIDATOS_FIN = 12;

    const inicioCrudo = mundoAPosCelda(grilla, jugador.x, jugador.y);
    const inicioCand = listarCeldasLibresCercanas(grilla, inicioCrudo, 45);
    const inicio = inicioCand[0];
    if (!inicio) return limpiarRutaJugador();

    const finCrudo = mundoAPosCelda(grilla, x, y);
    const finCandAll = listarCeldasLibresCercanas(grilla, finCrudo, 60);
    if (!finCandAll.length) return limpiarRutaJugador();

    const finCand = finCandAll.slice(0, MAX_CANDIDATOS_FIN);

    let rutaCeldas = [];
    for (const candidato of finCand) {
      const r = encontrarRutaAEstrella(grilla, inicio, candidato, {
        diagonales: true,
        maxExpansiones,
        maxPasosRuta,
      });

      if (r.length) {
        rutaCeldas = r;
        break;
      }
    }

    if (!rutaCeldas.length) return limpiarRutaJugador();

    const rutaGiros = comprimirRutaPorGiros(rutaCeldas);
    const waypoints = rutaGiros.map((c) => celdaAMundo(grilla, c.x, c.y));

    if (waypoints.length > maxPasosRuta) return limpiarRutaJugador();

    establecerRutaJugador(waypoints);
  }

  const camara = useMemo(
    () => ({
      objetivo: { x: jugador.x, y: jugador.y },
      delayMs: 300,
      suavizadoMs: 160,
      offsetX: 0,
      offsetY: -60,
      clampBordes: true,
      margenX: 200,
      margenY: 200,
    }),
    [jugador.x, jugador.y]
  );

  const paredesEnElMundo = [
    { id: "pared", categoria: "Pared", x: 150 / 2, y: 3200, ancho: 150, alto: 3200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 600, y: 1200, ancho: 900, alto: 1200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 900, y: 1400, ancho: 300, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1150, y: 1200, ancho: 200, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1350, y: 400, ancho: 600, alto: 400, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1850, y: 1200, ancho: 400, alto: 1200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2250, y: 600, ancho: 400, alto: 600, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1550, y: 1200, ancho: 200, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1750, y: 1400, ancho: 200, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2100, y: 1200, ancho: 100, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2400, y: 1200, ancho: 100, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2700, y: 1200, ancho: 500, alto: 1200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2850, y: 1400, ancho: 200, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 3600, y: 1100, ancho: 1300, alto: 1100, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 4375, y: 3200, ancho: 250, alto: 3200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 3600, y: 3200, ancho: 1300, alto: 1300, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2900, y: 3200, ancho: 100, alto: 1600, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2800, y: 2000, ancho: 100, alto: 400, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2650, y: 3200, ancho: 400, alto: 800, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 2500, y: 2000, ancho: 100, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1750, y: 1800, ancho: 200, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 900, y: 1800, ancho: 300, alto: 200, mostrarDebug: debug.activo },
    { id: "pared", categoria: "Pared", x: 1300, y: 3200, ancho: 2300, alto: 1400, mostrarDebug: debug.activo },
  ];

  // ✅ RIVALES: ya NO pasamos imagen/imagenDerrotado -> sale del selector
  const enemigosPresentes = [
    {
      id: "RIVAL_DIRECTO 0",
      nombre: "Calavera miju",
      familia: "CALAVERA",
      tier: 1,
      vidas: 4,
      escudos: 2,
      x: 1340,
      y: 1330,
      npcAncho: 128,
      npcAlto: 128,
      colider: { ancho: 60, alto: 20, offsetX: 0, offsetY: 0 },
      usarIndirecta: false,
      usarDirecta: true,
      dirAncho: 150,
      dirAlto: 150,
      dirMargen: 50,
      combatePlantillaId: "COMBATE_RIVAL",
      combateProps: {},
      patrullaActiva: true,
      patrullaAncho: 160,
      patrullaAlto: 120,
      patrullaVelocidad: 45,
      mostrarDebug: debug.activo,
    },
    {
      id: "RIVAL_DIRECTO 1",
      nombre: "Calavera Mija",
      familia: "CALAVERA",
      tier: 1,
      
      escudos: 0,
      x: 2100,
      y: 3200 / 2,
      npcAncho: 128,
      npcAlto: 128,
      colider: { ancho: 60, alto: 20, offsetX: 0, offsetY: 0 },
      usarIndirecta: false,
      usarDirecta: true,
      dirAncho: 150,
      dirAlto: 150,
      dirMargen: 50,
      combatePlantillaId: "COMBATE_RIVAL",
      combateProps: {},
      patrullaActiva: true,
      patrullaAncho: 160,
      patrullaAlto: 120,
      patrullaVelocidad: 45,
      mostrarDebug: debug.activo,
    },
    {
      id: "RIVAL_DIRECTO 3",
      nombre: "Calavera Mijo",
      familia: "CALAVERA",
      tier: 2,
      
      escudos: 1,
      x: 2400,
      y: 3200 / 2,
      npcAncho: 128,
      npcAlto: 128,
      colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: 0 },
      usarIndirecta: false,
      usarDirecta: true,
      dirAncho: 150,
      dirAlto: 150,
      dirMargen: 50,
      combatePlantillaId: "COMBATE_RIVAL",
      combateProps: {},
      patrullaActiva: true,
      patrullaAncho: 160,
      patrullaAlto: 120,
      patrullaVelocidad: 45,
      mostrarDebug: debug.activo,
    },
  ];

  const puertasPresentes = [
    {
      id: "PUERTA_1",
      x: 1350,
      y: 1200,
      ancho: 200,
      alto: 144.44,
      imagenCerrada: puertaCerrada,
      imagenAbierta: puertaAbierta,
      colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: -10 },
      requisitoHabilitado: false,
      usarInteraccionIndirecta: true,
      tecla: "E",
      intAncho: 320,
      intAlto: 280,
      intOffsetX: 0,
      intOffsetY: 80,
      intMargenZona: 10,
    },
    {
      id: "PUERTA_2",
      x: 2250,
      y: 1200,
      ancho: 200,
      alto: 144.44,
      imagenCerrada: puertaCerrada,
      imagenAbierta: puertaAbierta,
      colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: -10 },
      requisitoHabilitado: false,
      usarInteraccionIndirecta: true,
      tecla: "E",
      intAncho: 320,
      intAlto: 240,
      intOffsetX: 0,
      intOffsetY: 30,
      intMargenZona: 10,
    },
    {
      id: "PUERTA_3",
      x: 2652,
      y: 1944,
      ancho: 200,
      alto: 144.44,
      imagenCerrada: puertaCerrada,
      imagenAbierta: puertaAbierta,
      colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: 0 },
      requisitoHabilitado: true,
      usarInteraccionIndirecta: true,
      tecla: "E",
      intAncho: 320,
      intAlto: 240,
      intOffsetX: 0,
      intOffsetY: 30,
      intMargenZona: 10,
    },
  ];

  return (
    <>
      <Mundo
        ancho={ANCHO_MUNDO}
        largo={LARGO_MUNDO}
        bg={fondo}
        pantallaCompleta
        alClickMundo={alClickMundo}
        camara={camara}
      >
        {paredesEnElMundo.map((objeto, i) => (
          <Objeto
            key={objeto.id + i}
            id={objeto.id + i}
            categoria={objeto.categoria}
            x={objeto.x}
            y={objeto.y}
            ancho={objeto.ancho}
            alto={objeto.alto}
            imagen={objeto.imagen}
            colider={objeto.colider}
            mostrarDebug={objeto.mostrarDebug}
          />
        ))}

        {puertasPresentes.map((p, i) => (
          <Puerta
            key={`${p.id}_${i}`}
            id={`${p.id}_${i}`}
            {...p}
            flashBloqueadaMs={100}
            mostrarDebug={debug.activo}
          />
        ))}

        {enemigosPresentes.map((rival) => (
          <Rival key={rival.id} id={rival.id} {...rival} />
        ))}

        <TrazoRuta anchoMundo={ANCHO_MUNDO} largoMundo={LARGO_MUNDO} mostrar={debug.activo} />

        {marca && (
          <MarcaClick
            key={marca.key}
            x={marca.x}
            y={marca.y}
            tam={100}
            imagen={marcaClickGif}
            zIndex={999999}
          />
        )}

        <Jugador ancho={spriteJugador.ancho} alto={spriteJugador.alto} />

        <IndicadorInteraccionIndirecta
          imagen={IconoE}
          tam={128}
          altoJugador={spriteJugador.alto}
          offsetY={-10}
        />

        <Teleport
          id="tp_salida_1"
          x={518}
          y={1400}
          ancho={255}
          alto={200}
          tecla="E"
          rutaDestino="/sena/mundotest"
          mtrarDebug={debug.activo}
          portalImagen={PortalSVG}
          portalAncho={255}
          portalAlto={199}
          portalColider={{ ancho: 120, alto: 120, offsetX: 0, offsetY: -100 }}
          portalBloqueaMovimiento={false}
        />
      </Mundo>

      <SistemaMoverJugador />
      <SistemaInteraccionIndirecta />
    </>
  );
}
