import { Facebook, Instagram, Mail } from "lucide-react";
import WhatsAppIcon from "../ui/WhatsAppIcon";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f5f5f5] border-t border-gray-200 mt-auto font-sans text-gray-700">

      {/* ── Seção superior e intermediária unificadas ── */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto py-12 px-8 flex flex-col gap-16">
          
          {/* Grid Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            
            {/* Atendimento & Social */}
            <div>
              <h3 className="text-[#1541FC] font-bold text-lg mb-6 uppercase tracking-tight">Atendimento</h3>
              <ul className="space-y-4 mb-8">
                <li>
                  <a
                    href="https://wa.me/5563992349085"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-[#1541FC] transition-colors"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-[#1541FC]" />
                    (63) 9 9234-9085
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:clecipersonaliza@gmail.com"
                    className="flex items-center gap-2 hover:text-[#1541FC] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-[#1541FC]" />
                    clecipersonaliza@gmail.com
                  </a>
                </li>
              </ul>

              <h3 className="text-[#1541FC] font-bold text-lg mb-4 uppercase tracking-tight">Siga-nos</h3>
              <div className="flex gap-3">
                <a href="#" aria-label="Facebook" className="w-10 h-10 bg-[#1541FC] rounded-lg flex items-center justify-center text-white hover:bg-[#1034D3] transition-colors shadow-sm">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.instagram.com/clecipersonaliza/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-[#1541FC] rounded-lg flex items-center justify-center text-white hover:bg-[#1034D3] transition-colors shadow-sm">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://wa.me/556392349085" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 bg-[#1541FC] rounded-lg flex items-center justify-center text-white hover:bg-[#1034D3] transition-colors shadow-sm">
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Segurança */}
            <div className="md:text-right">
              <h3 className="text-[#1541FC] font-bold text-lg mb-6 flex md:justify-end uppercase tracking-tight">Segurança</h3>
              <div className="flex flex-col gap-4 items-start md:items-end">
                <div className="flex flex-col items-center bg-white border border-gray-200 p-1 rounded shadow-sm w-fit">
                  <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-t w-full text-center">SITE SEGURO</div>
                  <div className="flex items-center gap-1 p-1">
                    <div className="bg-amber-400 rounded-full w-4 h-4 flex items-center justify-center text-white">
                      <span className="text-[10px] font-bold">🔒</span>
                    </div>
                    <div className="text-[#1e3a8a] flex flex-col items-start leading-none text-left">
                      <span className="font-black text-xs">SSL</span>
                      <span className="text-[7px] font-bold">256 BITS</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-emerald-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" aria-hidden="true">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-tight text-left">
                    <span className="text-[9px] text-[#5f6368] font-bold">Safe Browsing</span>
                    <span className="font-bold" style={{ color: "#4285F4" }}>
                      G<span style={{ color: "#EA4335" }}>o</span>
                      <span style={{ color: "#FBBC05" }}>o</span>g
                      <span style={{ color: "#34A853" }}>l</span>
                      <span style={{ color: "#EA4335" }}>e</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* ── Créditos ── */}
      <div className="w-full border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

          <div className="flex flex-col gap-4 text-[13px] text-[#666]">
            <div className="w-[80px] h-auto flex items-center justify-center">
              <img 
                src="/icons/logotipo.jpg" 
                alt="Cleci Personaliza Logotipo" 
                className="w-full h-auto object-contain"
                width={80}
                height={60}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-[#1e3d59] text-[15px]">CLECI PERSONALIZA LTDA</span>
              <span>CNPJ: 28.402.051/0001-69</span>
              <span className="max-w-md">RUA BELMIRO DA SILVA PRADO, QD 20 LT 02, NOVA CAPITAL, PORTO NACIONAL - TO, CEP 77501-388</span>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-1">
            <span className="text-[13px] text-[#666] mb-1">Desenvolvido por:</span>
            <div className="flex items-center">
            <a 
              href="https://www.kennidianderson.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://i.imgur.com/N12sJ6J.png" 
                alt="Agência Desenvolvedora" 
                className="h-16 md:h-24 w-auto object-contain transition-transform hover:scale-105 duration-300"
              />
            </a>
            </div>
          </div>

        </div>
      </div>

    </footer>
  );
}
