"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { LINKS_BRAND } from "@/data/links-page";

export default function LinksHero() {
  return (
    // O <header> NÃO anima — só o conteúdo interno, para o fundo não vazar.
    <header className="lk-hero">
      <motion.div
        className="lk-section-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lk-hero__avatar">
          <Link href="/" aria-label="Ir para o site da Cleci Personaliza">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LINKS_BRAND.logo} alt={LINKS_BRAND.name} className="lk-hero__logo-img" />
          </Link>
        </div>

        <h1 className="lk-hero__title">Olá, Seja Bem Vindo!</h1>
        <p className="lk-hero__description">Conheça Nossos Produtos e Faça seu Orçamento</p>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="lk-hero__scroll-indicator"
          aria-hidden="true"
        >
          <ChevronDown className="lk-hero__chevron" />
        </motion.div>
      </motion.div>
    </header>
  );
}
