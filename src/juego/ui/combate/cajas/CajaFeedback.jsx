// src/ui/combate/cajas/CajaFeedback.jsx
import "./CajaFeedback.css";

export default function CajaFeedback({ titulo = "CORRECTO", texto = "", delayMs = 2000 }) {
  const seg = Math.round(Math.max(0, Number(delayMs || 0)) / 100) / 10;

  return (
    <div className="pixel-ui2 caja-feedback">
      <div className="pixel-ui2 caja-feedback__bar">
        <div className="pixel-ui2 caja-feedback__barText">{titulo}</div>
      </div>

      <div className="pixel-ui2 caja-feedback__body">{texto}</div>
      <div className="pixel-ui2 caja-feedback__hint">SIGUIENTE TURNO EN {seg}s…</div>
    </div>
  );
}
