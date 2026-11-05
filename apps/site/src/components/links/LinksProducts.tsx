"use client";

import { motion } from "motion/react";
import LazyImage from "./LazyImage";
import { PRODUCT_IMAGES } from "@/data/links-page";

export default function LinksProducts() {
  const [featured, ...rest] = PRODUCT_IMAGES;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="lk-products-heading"
      className="lk-products"
    >
      <div className="lk-section-container">
        <div className="lk-products__header">
          <h2 id="lk-products-heading" className="lk-products__title">Conheça nossos produtos</h2>
          <p className="lk-products__subtitle">
            Nossas criações vão além da impressão: entregam qualidade, personalização e um toque exclusivo para sua marca.
          </p>
        </div>

        <div className="lk-products__grid" role="list">
          {featured && (
            <div className="lk-products__card lk-products__card--large" role="listitem">
              <LazyImage src={featured.src} alt={featured.alt} className="lk-products__card-image" />
              <div className="lk-products__card-overlay" aria-hidden="true">
                <span className="lk-products__card-label">{featured.label}</span>
              </div>
            </div>
          )}

          {rest.map((img) => (
            <div key={img.id} className="lk-products__card" role="listitem">
              <LazyImage src={img.src} alt={img.alt} className="lk-products__card-image" />
              <div className="lk-products__card-overlay" aria-hidden="true">
                <span className="lk-products__card-label">{img.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
