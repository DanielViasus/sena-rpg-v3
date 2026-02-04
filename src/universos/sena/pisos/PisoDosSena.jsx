

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
import rivalCalavera from "../../../assets/gif/personajes/rivales/gifRival_128x128_180ms.webp";
import rivalCalaveraDerrorada from "../../../assets/gif/personajes/rivales/derrotaRival4.svg";

import puertaAbierta from "../../../assets/svg/objetos/Puertas/puertaAbierta.svg"
import puertaCerrada from "../../../assets/svg/objetos/Puertas/puertaCerrada.svg"


// +++ agrega tu icono (ajusta la ruta real)
import IconoE from "../../../assets/svg/ui/icono/pressE_128x128_400ms.gif";
import PortalSVG from "../../../assets/svg/objetos/portal/PortalSVG.svg";

import AficheLogoSena from "../../../assets/svg/objetos/Decoraciones/Afiche/AficheLogoSena129x162.svg"
import tableroCorcho from "../../../assets/svg/objetos/Decoraciones/Afiche/CompTableroInformativo209x154.svg"

import EscritorioMaestro from "../../../assets/svg/objetos/Escritorios/EscritorioMaestro309x141.svg";
import Escritorio1 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteDos180x162.svg";
import Escritorio2 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteTres180x162.svg";
import Escritorio3 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteCuatro180x162.svg";
import Escritorio4 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteCinco180x162.svg";
import Escritorio5 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteCero180x162.svg";
import Escritorio6 from "../../../assets/svg/objetos/Escritorios/EscritorioEstudienteUno180x162.svg";
import Tablero from "../../../assets/svg/objetos/Escritorios/Tablero186x158.svg";

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
   const { jugador, navegacion, debug, interaccionIndirecta } = useEstadoJuego();

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
  }, [ANCHO_MUNDO, LARGO_MUNDO, establecerPosicionJugador, guardarInicioJugador]);

  function alClickMundo({ x, y }) {
  // 1) Marca visual
  marcar({ x, y });

  // =========================
  // LIMITES DE SEGURIDAD
  // =========================
  const MAX_DIST_PX = 1500;

  const dx = x - jugador.x;
  const dy = y - jugador.y;
  const dist = Math.hypot(dx, dy);

  // Si está muy lejos, cancelamos para evitar rutas enormes
  if (dist > MAX_DIST_PX) {
    return limpiarRutaJugador();
  }

  // Traducimos 1500px a pasos (celdas) según tamCelda
  const maxPasosRuta = Math.ceil(MAX_DIST_PX / grilla.tamCelda) + 20;

  // Budget de expansiones (heurístico, ajustable)
  const maxExpansiones = maxPasosRuta * 200;

  // Para no quedarnos probando demasiados candidatos en caso imposible
  const MAX_CANDIDATOS_FIN = 12;

  // 2) Ruta A*
  const inicioCrudo = mundoAPosCelda(grilla, jugador.x, jugador.y);
  const inicioCand = listarCeldasLibresCercanas(grilla, inicioCrudo, 45);
  const inicio = inicioCand[0];
  if (!inicio) return limpiarRutaJugador();

  const finCrudo = mundoAPosCelda(grilla, x, y);
  const finCandAll = listarCeldasLibresCercanas(grilla, finCrudo, 60);
  if (!finCandAll.length) return limpiarRutaJugador();

  // Limitar candidatos (mejora cuando no hay ruta)
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

  // Cinturón y tirantes: si por alguna razón quedó enorme, no mover
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

      // Márgenes “universo” (ajustables)
      margenX: 200,
      margenY: 200,
    }),
    [jugador.x, jugador.y]
  );


  const paredesEnElMundo = [
    {
      id:"pared",
      categoria:"Pared",
      x:150/2,
      y:3200,
      ancho:150,
      alto:3200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:600,
      y:1200,
      ancho:900,
      alto:1200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:900,
      y:1400,
      ancho:300,
      alto:200,
      mostrarDebug:debug.activo,
    },//puerta 1,1

    {
      id:"pared",
      categoria:"Pared",
      x:1150,
      y:1200,
      ancho:200,
      alto:200,
      mostrarDebug:debug.activo,
    },//puerta 2,1

    {
      id:"pared",
      categoria:"Pared",
      x:1350,
      y:400,
      ancho:600,
      alto:400,
      mostrarDebug:debug.activo,
    },

    {
      id:"pared",
      categoria:"Pared",
      x:1850,
      y:1200,
      ancho:400,
      alto:1200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2250,
      y:600,
      ancho:400,
      alto:600,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:1550,
      y:1200,
      ancho:200,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:1750,
      y:1400,
      ancho:200,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2100,
      y:1200,
      ancho:100,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2400,
      y:1200,
      ancho:100,
      alto:200,
      mostrarDebug:debug.activo,
    },// pared 10
    {
      id:"pared",
      categoria:"Pared",
      x:2700,
      y:1200,
      ancho:500,
      alto:1200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2850,
      y:1400,
      ancho:200,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:3600,
      y:1100,
      ancho:1300,
      alto:1100,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:4375,
      y:3200,
      ancho:250,
      alto:3200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:3600,
      y:3200,
      ancho:1300,
      alto:1300,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2900,
      y:3200,
      ancho:100,
      alto:1600,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2800,
      y:2000,
      ancho:100,
      alto:400,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:2650,
      y:3200,
      ancho:400,
      alto:800,
      mostrarDebug:debug.activo,
    },
     {
      id:"pared",
      categoria:"Pared",
      x:2500,
      y:2000,
      ancho:100,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:1750,
      y:1800,
      ancho:200,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:900,
      y:1800,
      ancho:300,
      alto:200,
      mostrarDebug:debug.activo,
    },
    {
      id:"pared",
      categoria:"Pared",
      x:1300,
      y:3200,
      ancho:2300,
      alto:1400,
      mostrarDebug:debug.activo,
    },
  ];


  const enemigosPresentes = [
  {
    id: "RIVAL_DIRECTO 0",
    x: 1340,
    y: 1330,
    imagen: rivalCalavera,
    imagenDerrotado: rivalCalaveraDerrorada,

    // tamaño del sprite del NPC (si lo quieres explícito)
    npcAncho: 128,
    npcAlto: 128,

    // ✅ collider físico del NPC (NO ocupa todo el gif)
    colider: { ancho: 60, alto: 20, offsetX: 0, offsetY: 0 },

    usarIndirecta: false,
    usarDirecta: true,
    dirAncho: 150,
    dirAlto: 150,
    dirMargen: 50,

    combatePlantillaId: "COMBATE_RIVAL",
    combateProps: { rivalNombre: "calaveraDirecta" },

    patrullaActiva: true,
    patrullaAncho: 160,
    patrullaAlto: 120,
    patrullaVelocidad: 45,

    mostrarDebug: debug.activo,
  },

  {
    id: "RIVAL_DIRECTO 1",
    x: 2100,
    y: 3200 / 2,
    imagen: rivalCalavera,
    imagenDerrotado: rivalCalaveraDerrorada,
    npcAncho: 128,
    npcAlto: 128,
    colider: { ancho: 60, alto: 20, offsetX: 0, offsetY: 0 },

    usarIndirecta: false,
    usarDirecta: true,
    dirAncho: 150,
    dirAlto: 150,
    dirMargen: 50,

    combatePlantillaId: "COMBATE_RIVAL",
    combateProps: { rivalNombre: "calaveraDirecta" },

    patrullaActiva: true,
    patrullaAncho: 160,
    patrullaAlto: 120,
    patrullaVelocidad: 45,

    mostrarDebug: debug.activo,
  },

  {
    id: "RIVAL_DIRECTO 2",
    x: 2400,
    y: 3200 / 2,
    imagen: rivalCalavera,
    imagenDerrotado: rivalCalaveraDerrorada,
    npcAncho: 128,
    npcAlto: 128,

    // ✅ tu ejemplo (pero ojo: alto=1 lo vuelve casi una línea)
    colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: 0 },

    usarIndirecta: false,
    usarDirecta: true,
    dirAncho: 150,
    dirAlto: 150,
    dirMargen: 50,

    combatePlantillaId: "COMBATE_RIVAL",
    combateProps: { rivalNombre: "calaveraDirecta" },

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

    // ✅ Collider físico (bloqueo) configurable (como Objeto)
    // Ejemplo: “columna” central delgada
    colider: { ancho: 200, alto: 1, offsetX: 0, offsetY: -10 },

    // ✅ Bloqueada por requisito (no abre/cierra)
    requisitoHabilitado: false,

    // ✅ Zona interacción INDIRECTA (más grande y por fuera)
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

    // ✅ Desbloqueada (sí abre/cierra)
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

      {paredesEnElMundo.map((objeto,i) => (
        
          <Objeto
            key={objeto.id+i}
            id={objeto.id+i}
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


       {enemigosPresentes.map((rival,a) => (
          <Rival key={rival.id+a} id={rival.id+a} {...rival} />
        ))}

        <TrazoRuta
          anchoMundo={ANCHO_MUNDO}
          largoMundo={LARGO_MUNDO}
          mostrar={debug.activo}
        />

      
 
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
          offsetY={-10}   // ajuste fino
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

          // ✅ Visual del portal
          portalImagen={PortalSVG}
          portalAncho={255}
          portalAlto={199}

          // Collider del portal (si quieres que se seleccione/bloquee algo)
          portalColider={{ ancho: 120, alto: 120, offsetX: 0, offsetY: -100 }}

          // Por defecto false; ponlo true si quieres que el portal sea obstáculo
          portalBloqueaMovimiento={false}
        />
      </Mundo>
      <SistemaMoverJugador />
      <SistemaInteraccionIndirecta/>
    </>
  );
}
/*

export default function PisoDosSena() {
  const ANCHO_MUNDO = 6400;
  const LARGO_MUNDO = 3200;

  const spriteJugador = { ancho: 128, alto: 128 };

  const { jugador, navegacion, debug, interaccionIndirecta } = useEstadoJuego();

  const {
    establecerPosicionJugador,
    guardarInicioJugador,
    establecerRutaJugador,
    limpiarRutaJugador,
  } = useAccionesJuego();

  const registro = useRegistroColisiones();
  const versionColisiones = useVersionRegistroColisiones();

  // ✅ Ajusta aquí la duración real de la marca del click
  const { marca, marcar } = useMarcaClick({ duracionMs: 300 });

  // Ajuste fino extra para “separar” ruta de colliders
  const PADDING_EXTRA_RUTA = 4;

  // Obstáculos desde el Registro (Map)
  const obstaculos = useMemo(() => {
    const arr = [];
    for (const item of registro.values()) {
      const { rect, meta } = item;
      if (meta?.bloqueaMovimiento === false) continue;
      arr.push(rect);
    }
    return arr;
  }, [registro, versionColisiones]);

  // Grilla A*
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

  // Spawn inicial jugador (centro del mundo)
  useEffect(() => {
    const xCentro = 1225;
    const yCentro = 520;
    establecerPosicionJugador(xCentro, yCentro);
    guardarInicioJugador(xCentro, yCentro);
  }, [ANCHO_MUNDO, LARGO_MUNDO, establecerPosicionJugador, guardarInicioJugador]);

  function alClickMundo({ x, y }) {
    // 1) Marca visual
    marcar({ x, y });

    // 2) Ruta A*
    const inicioCrudo = mundoAPosCelda(grilla, jugador.x, jugador.y);
    const inicioCand = listarCeldasLibresCercanas(grilla, inicioCrudo, 45);
    const inicio = inicioCand[0];
    if (!inicio) return limpiarRutaJugador();

    const finCrudo = mundoAPosCelda(grilla, x, y);
    const finCand = listarCeldasLibresCercanas(grilla, finCrudo, 60);
    if (!finCand.length) return limpiarRutaJugador();

    let rutaCeldas = [];
    for (const candidato of finCand) {
      const r = encontrarRutaAEstrella(grilla, inicio, candidato, { diagonales: true });
      if (r.length) {
        rutaCeldas = r;
        break;
      }
    }

    if (!rutaCeldas.length) return limpiarRutaJugador();

    const rutaGiros = comprimirRutaPorGiros(rutaCeldas);
    const waypoints = rutaGiros.map((c) => celdaAMundo(grilla, c.x, c.y));
    establecerRutaJugador(waypoints);
  }

  // ✅ Cámara (márgenes configurables)
  const camara = useMemo(
    () => ({
      objetivo: { x: jugador.x, y: jugador.y },
      delayMs: 300,
      suavizadoMs: 160,
      offsetX: 0,
      offsetY: -60,
      clampBordes: true,

      // Márgenes “universo” (ajustables)
      margenX: 200,
      margenY: 200,
    }),
    [jugador.x, jugador.y]
  );


const objetosPresentes = [
  {
    id:"classroom_right_side_wall",
    categoria:"Pared",
    x:1250,
    y:1609,
    ancho:250,
    alto:934,
    
    colider:{ ancho: 500, alto: 890, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"pared_frontal_salon_clases",
    categoria:"Pared",
    x:1000/2,
    y:300,
    ancho:500,
    alto:220,
    
    colider:{ ancho: 1000, alto: 300, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"pared_frontal_salon_clases_2",
    categoria:"Pared",
    x:1250,
    y:480,
    ancho:250,
    alto:220,
    
    colider:{ ancho: 550, alto: 300, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"logo_sena_salon_clases",
    categoria:"Decoration",
    x:172,
    y:280,
    ancho:129,
    alto:162,
    imagen:AficheLogoSena,
    colider:{ ancho: 2, alto: 6, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"tablero_salon_clases",
    categoria:"Decoration",
    x:480,
    y:280,
    ancho:386,
    alto:158,
    imagen:Tablero,
    colider:{ ancho: 200, alto: 60, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"tablero_corcho_salon_clases",
    categoria:"Decoration",
    x:835,
    y:280,
    ancho:209,
    alto:154,
    imagen:tableroCorcho,
    colider:{ ancho: 200, alto: 60, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"escritorio_maestro_salon_clases",
    categoria:"Decoration",
    x:480,
    y:524,
    ancho:309,
    alto:141,
    imagen:EscritorioMaestro,
    colider:{ ancho: 200, alto: 55, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },
  {
    id:"escritorio_1_salon_clases",
    categoria:"Decoration",
    x:233,
    y:850,
    ancho:180,
    alto:162,
    imagen:Escritorio1,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },

  {
    id:"escritorio_2_salon_clases",
    categoria:"Decoration",
    x:519,
    y:850,
    ancho:180,
    alto:162,
    imagen:Escritorio2,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },

  {
    id:"escritorio_3_salon_clases",
    categoria:"Decoration",
    x:779,
    y:850,
    ancho:180,
    alto:162,
    imagen:Escritorio3,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },

  {
    id:"escritorio_4_salon_clases",
    categoria:"Decoration",
    x:233,
    y:1100,
    ancho:180,
    alto:162,
    imagen:Escritorio4,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },

  {
    id:"escritorio_5_salon_clases",
    categoria:"Decoration",
    x:519,
    y:1100,
    ancho:180,
    alto:162,
    imagen:Escritorio5,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
  },

  {
    id:"escritorio_6_salon_clases",
    categoria:"Decoration",
    x:779,
    y:1100,
    ancho:180,
    alto:162,
    imagen:Escritorio6,
    colider:{ ancho: 100, alto: 85, offsetX: 0, offsetY: 0 },
    mostrarDebug:debug.activo,
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
        <TrazoRuta
          anchoMundo={ANCHO_MUNDO}
          largoMundo={LARGO_MUNDO}
          mostrar={debug.activo}
        />

      
 
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
          offsetY={-10}   // ajuste fino
        />


      
       
        

    

        {objetosPresentes.map((objeto) => (
          <Objeto
            key={objeto.id}
            id={objeto.id}
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

        

        
        <Teleport
          id="tp_salida_1"
          x={518}
          y={1400}
          ancho={255}
          alto={200}
          tecla="E"
          rutaDestino="/sena/mundotest"
          mtrarDebug={debug.activo}

          // ✅ Visual del portal
          portalImagen={PortalSVG}
          portalAncho={255}
          portalAlto={199}

          // Collider del portal (si quieres que se seleccione/bloquee algo)
          portalColider={{ ancho: 120, alto: 120, offsetX: 0, offsetY: -100 }}

          // Por defecto false; ponlo true si quieres que el portal sea obstáculo
          portalBloqueaMovimiento={false}
        />
      </Mundo>
      <SistemaMoverJugador />
      <SistemaInteraccionIndirecta/>
    </>
  );
} 
*/