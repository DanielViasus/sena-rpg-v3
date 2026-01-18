import { Routes, Route, Navigate } from "react-router-dom";

import Inicio from "../paginas/Inicio.jsx";
import NoEncontrado from "../paginas/NoEncontrado.jsx";

import UniversoSena from "../universos/sena/UniversoSena.jsx";
import PisoPrincipalSena from "../universos/sena/pisos/PisoPrincipalSena.jsx";
import PisoDosSena from       "../universos/sena/pisos/PisoDosSena.jsx";

export default function AppRutas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      {/* Universo (contenedor padre) */}
        <Route path="/sena" element={<UniversoSena />}>
        <Route index element={<PisoPrincipalSena />} />
        <Route path="/sena/mundotest" element={<PisoDosSena />} />
      </Route>

      
      

      {/* Alias opcional */}
      <Route path="/inicio" element={<Navigate to="/" replace />} />

      {/* 404 */}
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}
