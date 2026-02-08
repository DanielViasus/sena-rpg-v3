// src/ui/combate/cajas/CajaPregunta.jsx
import "./CajaPregunta.css";

const TECLAS_OPCION = ["S", "E", "N", "A"];

export default function CajaPregunta({
  modo = "ATAQUE", // ATAQUE | DEFENSA
  tier = 1,
  auraNivel = 0,
  atkMult = 1,
  defFailMult = 1,

  pregunta = null,
  opcionSeleccionada = null,
  setOpcionSeleccionada,

  onConfirmar,
  onHuir,

  debugActivo = false,
}) {
  const opciones = Array.isArray(pregunta?.opciones) ? pregunta.opciones : [];
  const correctaIdx = Number.isFinite(pregunta?.respuesta) ? pregunta.respuesta : -1;

  const textoInfo =
    modo === "ATAQUE"
      ? `ATAQUE • TIER: ${tier} • SI ACIERTAS GOLPEAS x${atkMult}`
      : `DEFENSA • TIER: ${tier} • SI FALLAS RECIBES DAÑO x${defFailMult}`;

  return (
    <div className="pixel-ui2 caja-pregunta">
      <div className="pixel-ui2 caja-pregunta__bar">
        <div className="pixel-ui2 caja-pregunta__barText">
          {pregunta ? pregunta.pregunta : "NO HAY PREGUNTAS DISPONIBLES"}
        </div>
      </div>

      <div className="pixel-ui2 caja-pregunta__area">
        <div className="pixel-ui2 caja-pregunta__grid">
          {opciones.map((op, idx) => {
            const selected = opcionSeleccionada === idx;
            const isCorrect = idx === correctaIdx;

            let extraClass = "";
            if (debugActivo) extraClass = isCorrect ? "btn--debug-ok" : "btn--debug-fail";
            else if (selected) extraClass = "btn--selected";

            const sigla = TECLAS_OPCION[idx] ?? "?";

            return (
              <button
                key={idx}
                className={`pixel-ui2 caja-pregunta__btn ${extraClass}`.trim()}
                onClick={() => setOpcionSeleccionada?.(idx)}
              >
                <div className="pixel-ui2 caja-pregunta__btnInner">
                  <div className="pixel-ui2 caja-pregunta__letter">{sigla}:</div>
                  <div className="pixel-ui2 caja-pregunta__text">{op}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          className={`pixel-ui2 caja-pregunta__confirm ${opcionSeleccionada === null ? "confirm--disabled" : ""}`.trim()}
          onClick={onConfirmar}
          disabled={opcionSeleccionada === null}
          title="CONFIRMAR / ATAQUE"
        >
          ATAQUE
        </button>
      </div>

      <div className="pixel-ui2 caja-pregunta__footer">
        <div className="pixel-ui2 caja-pregunta__hint">
          {textoInfo} • ATAJOS: S/E/N/A O 1/2/3/4 • MISMA TECLA 2 VECES CONFIRMA
        </div>

        <button className="pixel-ui2 caja-pregunta__huir" onClick={onHuir}>
          HUIR
        </button>
      </div>
    </div>
  );
}
