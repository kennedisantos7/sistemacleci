import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Tapetes from "./pages/Tapetes";
import Grafica from "./pages/Grafica";
import Sacolas from "./pages/Sacolas";
import Playground from "./pages/Playground";
import MesasFreezers from "./pages/MesasFreezers";
import ProductDetails from "./pages/ProductDetails";
import Seguranca from "./pages/Seguranca";
import ComunicacaoVisual from "./pages/ComunicacaoVisual";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="produtos" element={<Products />} />
          <Route path="tapetes" element={<Tapetes />} />
          <Route path="grafica" element={<Grafica />} />
          <Route path="sacolas" element={<Sacolas />} />
          <Route path="playground" element={<Playground />} />
          <Route path="mesas-e-freezers" element={<MesasFreezers />} />
          <Route path="seguranca" element={<Seguranca />} />
          <Route path="comunicacao-visual" element={<ComunicacaoVisual />} />
          <Route path="produto/:id" element={<ProductDetails />} />
          {/* Fallback to Home for unhandled routes */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
