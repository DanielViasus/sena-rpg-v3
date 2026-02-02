

// src/routes/scenes/sena/mainfloor/mainfloorSena.jsx
import { useEffect, useMemo } from "react";
import Mundo from "../../../juego/mundo/Mundo.jsx";
import fondo from "../../../assets/svg/fondos/demoW.png";


import Jugador from "../../../juego/entidades/jugador/Jugador.jsx";
import SistemaMoverJugador from "../../../juego/sistema/SistemaMoverJugador.jsx";

import Objeto from "../../../juego/objetos/Objeto.jsx";
import TrazoRuta from "../../../juego/ui/TrazoRuta.jsx";
import IndicadorInteraccionIndirecta from "../../../juego/ui/IndicadorInteraccionIndirecta.jsx";


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
    x:700/2,
    y:800,
    ancho:700,
    alto:800,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:750,
    y:900,
    ancho:100,
    alto:400,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:900,
    y:100,
    ancho:400,
    alto:100,
    mostrarDebug:debug.activo,
  },
   {
    id:"pared",
    categoria:"Pared",
    x:50,
    y:1300,
    ancho:100,
    alto:500,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1100/2,
    y:3200,
    ancho:1100,
    alto:1900,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:900,
    y:1300,
    ancho:400,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1050,
    y:900,
    ancho:100,
    alto:400,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1450,
    y:900,
    ancho:700,
    alto:900,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1800,
    y:1000,
    ancho:200,
    alto:500,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1400,
    y:3200,
    ancho:600,
    alto:700,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1900,
    y:3200,
    ancho:400,
    alto:800,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:1900,
    y:2100,
    ancho:400,
    alto:900,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:2350,
    y:2000,
    ancho:500,
    alto:1500,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4100,
    y:100,
    ancho:4600,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4350,
    y:200,
    ancho:3100,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4350,
    y:500,
    ancho:3100,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4500,
    y:1000,
    ancho:3800,
    alto:500,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:2400,
    y:3200,
    ancho:600,
    alto:600,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:3850,
    y:1200,
    ancho:2500,
    alto:200,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:2900,
    y:1300,
    ancho:600,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:2750,
    y:2800,
    ancho:100,
    alto:200,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:3050,
    y:2000,
    ancho:300,
    alto:400,
    mostrarDebug:debug.activo,
  },
  
  {
    id:"pared",
    categoria:"Pared",
    x:3400,
    y:2800,
    ancho:800,
    alto:1100,
    mostrarDebug:debug.activo,
  },

  {
    id:"pared",
    categoria:"Pared",
    x:4750,
    y:3200,
    ancho:3300,
    alto:700,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4150,
    y:1800,
    ancho:100,
    alto:100,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:4650,
    y:1800,
    ancho:900,
    alto:600,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:5550,
    y:1800,
    ancho:900,
    alto:300,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:5950,
    y:1500,
    ancho:100,
    alto:200,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:6050,
    y:1100,
    ancho:300,
    alto:100,
    mostrarDebug:debug.activo,
  },

  
   {
    id:"pared",
    categoria:"Pared",
    x:6300,
    y:1800,
    ancho:200,
    alto:800,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:6350,
    y:2500,
    ancho:100,
    alto:700,
    mostrarDebug:debug.activo,
  },
  {
    id:"pared",
    categoria:"Pared",
    x:6350,
    y:500,
    ancho:100,
    alto:400,
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