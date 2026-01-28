import React from "react";

export default function PlantillaTutorialMovimiento({ titulo, texto, cerrar }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 20 }}>{titulo || "Tutorial"}</h2>
      <p style={{ opacity: 0.9, lineHeight: 1.4 }}>
        {texto || "Contenido del tutorial..."}
      </p>

      <button
        onClick={cerrar}
        style={{
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.08)",
          color: "white",
          cursor: "pointer",
        }}
      >
        Cerrar
      </button>
    </div>
  );
}
