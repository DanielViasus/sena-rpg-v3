import { Routes, Route, Navigate } from "react-router-dom";

import Inicio from "../paginas/Inicio.jsx";
import NoEncontrado from "../paginas/NoEncontrado.jsx";

import UniversoSena from "../universos/sena/UniversoSena.jsx";
import PisoPrincipalSena from "../universos/sena/pisos/PisoPrincipalSena.jsx";

export default function AppRutas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      {/* Universo (contenedor padre) */}
      <Route path="/sena" element={<UniversoSena />}>
        {/* Piso por defecto del universo */}
        <Route index element={<PisoPrincipalSena />} />

        {/* Pisos futuros:
        <Route path="piso-2" element={<PisoDosSena />} />
        */}
      </Route>

      {/* Alias opcional */}
      <Route path="/inicio" element={<Navigate to="/" replace />} />

      {/* 404 */}
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}
