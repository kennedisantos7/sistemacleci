import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const slides = [
  {
    id: 1,
    title: "Sacolas e Brindes Personalizados",
    subtitle: "Destaque sua marca com materiais de alta qualidade e impressão premium.",
    tag: "Sacolas",
    bgColor: "bg-[#1541FC]",
    primaryLink: "/sacolas",
    primaryText: "Ver Sacolas",
    secondaryLink: "/produtos",
    secondaryText: "Ver Catálogo",
    featuredProduct: {
      name: "Sacola Kraft Personalizada",
      desc: "Sacola ecológica de alta qualidade, ideal para empresas que buscam sustentabilidade e sofisticação.",
      image: "https://imgur.com/15qBuUf.png"
    }
  },
  {
    id: 2,
    title: "Tapetes de Vinil Personalizados",
    subtitle: "Soluções sob medida para recepções, lojas e condomínios.",
    tag: "Tapetes",
    bgColor: "bg-[#FE0000]",
    primaryLink: "/tapetes",
    primaryText: "Ver Tapetes",
    secondaryLink: "/produtos",
    secondaryText: "Ver Catálogo",
    featuredProduct: {
      name: "Tapete Gold Vulcanizado",
      desc: "Personalização permanente e de alta durabilidade com logotipo encaixado na própria base.",
      image: "https://i.imgur.com/B47h1h2.png"
    }
  },
  {
    id: 3,
    title: "Material Gráfico Profissional",
    subtitle: "Cartões, folders e papelaria completa para sua empresa.",
    tag: "Gráfica",
    bgColor: "bg-[#1541FC]",
    primaryLink: "/grafica",
    primaryText: "Ver Gráfica",
    secondaryLink: "/produtos",
    secondaryText: "Ver Catálogo",
    featuredProduct: {
      name: "Cartão de Visita Premium",
      desc: "Excelente ferramenta de marketing pessoal ou empresarial, com opção de verniz localizado e acabamento premium.",
      image: "https://imgur.com/1XvQuHB.png"
    }
  },
  {
    id: 4,
    title: "Comunicação Visual de Impacto",
    subtitle: "Banners, lonas e placas que valorizam sua fachada.",
    tag: "Comunicação",
    bgColor: "bg-[#FE0000]",
    primaryLink: "/comunicacao-visual",
    primaryText: "Ver Soluções",
    secondaryLink: "/produtos",
    secondaryText: "Ver Detalhes",
    featuredProduct: {
      name: "Banner Personalizado",
      desc: "Banner de alta qualidade com produção sob medida, ideal para eventos, feiras e publicidade com impacto visual.",
      image: "https://imgur.com/IHuq9nW.png"
    }
  },
  {
    id: 5,
    title: "Segurança e Sinalização",
    subtitle: "Pisos táteis, fitas antiderrapantes e revestimentos de alta performance.",
    tag: "Segurança",
    bgColor: "bg-[#1541FC]",
    primaryLink: "/seguranca",
    primaryText: "Ver Soluções",
    secondaryLink: "/produtos",
    secondaryText: "Ver Detalhes",
    featuredProduct: {
      name: "Piso Tátil",
      desc: "Revestimento tátil de alerta e direcional para acessibilidade e sinalização com segurança.",
      image: "https://imgur.com/3M59FBt.png"
    }
  },
  {
    id: 6,
    title: "Grama Sintética e Lazer",
    subtitle: "Revestimentos versáteis, de alta durabilidade e baixa manutenção para áreas externas e internas.",
    tag: "Playground",
    bgColor: "bg-[#FE0000]",
    primaryLink: "/playground",
    primaryText: "Ver Grama Sintética",
    secondaryLink: "/produtos",
    secondaryText: "Ver Catálogo",
    featuredProduct: {
      name: "Grama Sintética Premium",
      desc: "Ideal para playgrounds, jardins, piscinas e áreas de lazer, resistente ao sol e livre de manutenção.",
      image: "https://imgur.com/nIkEq2W.png"
    }
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  return (
    <section className="relative w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter mt-4 md:mt-8 mb-8 md:mb-section-gap group">
      <div className="relative h-[300px] md:h-[450px] lg:h-[500px] w-full rounded-xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="sync">
          {slides.map((slide, index) => (
            index === current && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={cn("absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center px-6 md:px-12 gap-x-12 lg:gap-x-24", slide.bgColor)}
              >
                {/* Lado Esquerdo: Copy (Hidden on Mobile) */}
                <div className="relative z-10 hidden md:flex md:w-auto md:max-w-md lg:max-w-lg flex-col justify-center text-white h-full">
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white font-label-md text-[9px] md:text-label-md rounded-full mb-2 md:mb-5 uppercase tracking-wider border border-white/30">
                      {slide.tag}
                    </span>
                    <h1 className="font-headline-lg text-xl md:text-3xl lg:text-5xl text-white mb-1.5 md:mb-3 font-black leading-tight">
                      {slide.title}
                    </h1>
                    <p className="hidden md:block font-body-lg text-sm md:text-base lg:text-lg text-white/90 mb-6 md:mb-8 text-balance max-w-md">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-3 md:mt-0">
                      <Link to={slide.primaryLink} className="bg-white text-on-surface font-label-md text-[11px] md:text-label-md px-4 md:px-8 py-2.5 md:py-4 rounded-DEFAULT hover:bg-white/90 transition-colors shadow-lg font-bold">
                        {slide.primaryText}
                      </Link>
                      <Link to={slide.secondaryLink} className="hidden sm:inline-flex bg-transparent border border-white/50 text-white font-label-md text-xs md:text-label-md px-5 md:px-8 py-2.5 md:py-4 rounded-DEFAULT hover:bg-white/10 transition-colors">
                        {slide.secondaryText}
                      </Link>
                    </div>
                  </motion.div>
                </div>

                {/* Lado Direito: Produto em Destaque (Visible on Mobile) */}
                <div className="flex md:flex w-full md:w-auto h-full items-center justify-center -translate-y-2 md:translate-y-0">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/20 flex flex-col items-center text-center w-52 sm:w-64 lg:w-72 shadow-2xl relative"
                  >
                    {/* Tag da Categoria no Topo do Card */}
                    <span className="absolute -top-3 px-3 py-1 bg-white text-[#1541FC] font-bold text-[9px] uppercase tracking-widest rounded-full shadow-md border border-white/20 z-20">
                      {slide.tag}
                    </span>

                    <div className="w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-white rounded-xl mb-3 md:mb-4 overflow-hidden shadow-inner flex items-center justify-center p-2 mt-2">
                      <img 
                        src={slide.featuredProduct.image} 
                        alt={slide.featuredProduct.name}
                        className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="text-white font-bold text-xs sm:text-base lg:text-lg mb-1 leading-tight">
                      {slide.featuredProduct.name}
                    </h3>
                    <p className="text-white/70 text-[8px] sm:text-[9px] lg:text-xs font-medium line-clamp-2">
                      {slide.featuredProduct.desc}
                    </p>
                    <Link 
                      to={slide.primaryLink}
                      className="mt-2.5 md:mt-4 text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-white border-b border-white/30 hover:border-white transition-all pb-1"
                    >
                      Ver Detalhes
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Navigation Controls */}
        <button 
          onClick={prev}
          className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur shadow-sm border border-white/20 flex items-center justify-center text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
          onClick={next}
          className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur shadow-sm border border-white/20 flex items-center justify-center text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`transition-all duration-300 rounded-full h-1.5 ${
                current === index 
                  ? "w-8 bg-white" 
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
