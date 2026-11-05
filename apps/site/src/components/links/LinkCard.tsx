"use client";

import { motion } from "motion/react";
import type { LinkItem } from "@/data/links-page";
import LazyImage from "./LazyImage";

interface LinkCardProps {
  item: LinkItem;
  index: number;
}

export default function LinkCard({ item, index }: LinkCardProps) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      aria-label={`${item.title} – ${item.subtitle}`}
      className="lk-link-card-image-wrap"
    >
      {/* Os dois primeiros cards aparecem na primeira tela: carregam já. */}
      <LazyImage src={item.image} alt={item.title} className="lk-link-card-image" priority={index < 2} />
    </motion.a>
  );
}
