import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./App.css";

import { ProveedorEstadoJuego } from "./estado/EstadoJuego.jsx";
import { ProveedorRegistroColisiones } from "./juego/colisiones/RegistroColisiones.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProveedorEstadoJuego>
        <ProveedorRegistroColisiones>
          <App />
        </ProveedorRegistroColisiones>
      </ProveedorEstadoJuego>
    </BrowserRouter>
  </React.StrictMode>
);
