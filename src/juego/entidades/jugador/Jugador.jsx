import { useEstadoJuego } from "../../../estado/EstadoJuego.jsx";
import aspectoDefault from "../../../assets/svg/personajes/jugador/Crock.gif";



const ASPECTOS = {
  default: aspectoDefault,
};

export default function Jugador({
  ancho = 128,
  alto = 128,
  

  mostrarSombra = false,   
  mostrarDebug,           
}) {

  const { jugador, debug } = useEstadoJuego();
const { ancho: coliderAncho, alto: coliderAlto, offsetX: coliderOffsetX, offsetY: coliderOffsetY } = jugador.colider;


const debugActivo = typeof mostrarDebug === "boolean" ? mostrarDebug : debug.activo;
  const src = ASPECTOS[jugador.aspecto] ?? ASPECTOS.default;

  // Collider dentro del sprite (coordenadas internas, relativo al contenedor 128x128)
  const coliderLeft = Math.round((ancho - coliderAncho) / 2 + coliderOffsetX);
  const coliderTop = Math.round(alto - coliderAlto + coliderOffsetY);

  // Punto "pies" dentro del sprite = centro inferior del collider
  const piesXLocal = coliderLeft + coliderAncho / 2;
  const piesYLocal = coliderTop + coliderAlto;

  // Como estado.jugador.x/y son "pies" en el mundo, calculamos top-left del sprite:
  const spriteLeft = Math.round(jugador.x - piesXLocal);
  const spriteTop = Math.round(jugador.y - piesYLocal);

  // zIndex desde el centro del collider en Y (independiente de offsets)
  const zIndex = Math.floor(jugador.y - coliderAlto / 2);

  return (
    <div
      style={{
        position: "absolute",
        left: spriteLeft,
        top: spriteTop,
        width: ancho,
        height: alto,
        pointerEvents: "none",
        zIndex,
      }}
      title={`pies x=${jugador.x} y=${jugador.y} z=${zIndex} aspecto=${jugador.aspecto}`}
    >
      {mostrarSombra && (
  <div
    style={{
      position: "absolute",
      left: piesXLocal,
      top: piesYLocal,
      transform: "translate(-50%, -50%)",
      width: Math.round(ancho * 0.55),
      height: Math.max(8, Math.round(alto * 0.14)),
      borderRadius: "50%",
      background: "rgba(0,0,0,0.35)",
    }}
  />
)}


      {/* Aspecto */}
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* Debug */}
      {debugActivo && (
        <>
          {/* Caja sprite */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              outline: "2px dashed rgba(255,255,255,0.45)",
            }}
          />

          {/* Caja collider */}
          <div
            style={{
              position: "absolute",
              left: coliderLeft,
              top: coliderTop,
              width: coliderAncho,
              height: coliderAlto,
              background: "rgba(50, 120, 255, 0.35)",
              outline: "2px solid rgba(50, 120, 255, 0.9)",
            }}
          />

          {/* Punto pies (centro inferior del collider) */}
          <div
            style={{
              position: "absolute",
              left: piesXLocal - 3,
              top: piesYLocal - 3,
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "rgba(0,255,0,0.95)",
            }}
          />
        </>
      )}
    </div>
  );
}
