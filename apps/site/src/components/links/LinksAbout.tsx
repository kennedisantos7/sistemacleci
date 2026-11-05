"use client";

import { motion } from "motion/react";
import LazyImage from "./LazyImage";
import { LINKS_BRAND, TEAM_IMAGE } from "@/data/links-page";

export default function LinksAbout() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="lk-about-heading"
      className="lk-about"
    >
      <div className="lk-section-container">
        <h2 id="lk-about-heading" className="lk-about__title">Quem Somos</h2>

        <div className="lk-about__body">
          <div className="lk-about__image-wrap">
            <LazyImage src={TEAM_IMAGE.src} alt={TEAM_IMAGE.alt} className="lk-about__image" />
          </div>

          <div className="lk-about__text">
            <p className="lk-about__paragraph lk-about__paragraph--highlight">{LINKS_BRAND.description}</p>
            <p className="lk-about__paragraph">{LINKS_BRAND.description2}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
