
import AppRutas from "./rutas/AppRutas.jsx";
import AtajosTecladoJuego from "./juego/sistema/AtajosTecladoJuego.jsx";
import AtajosInteraccion from "./juego/sistema/AtajosInteraccion.jsx";
import PlantillaOverlay from "./ui/PlantillaOverlay.jsx";
import CombatePromptRival from "./juego/ui/CombatePromptRival.jsx";
import SistemaInteraccionIndirecta from "./juego/sistema/SistemaInteraccionIndirecta.jsx";
import SistemaInteraccionDirecta from "./juego/sistema/SistemaInteraccionDirecta.jsx";

export default function App() {
  return (
    <>
      <CombatePromptRival/>
      <SistemaInteraccionDirecta/>
      <SistemaInteraccionIndirecta/>
      <AtajosTecladoJuego />
      <AtajosInteraccion />
      <AppRutas />
      <PlantillaOverlay />
    </>
  );
}



/*
import AppRutas from "./rutas/AppRutas.jsx";
import AtajosTecladoJuego from "./juego/sistema/AtajosTecladoJuego.jsx";
import AtajosInteraccion from "./juego/sistema/AtajosInteraccion.jsx";
import PlantillaOverlay from "./ui/PlantillaOverlay.jsx";

export default function App() {
  return (
    <>
      <AtajosTecladoJuego />
      <AtajosInteraccion />
      <AppRutas />
      <PlantillaOverlay />
    </>
  );
}


*/
