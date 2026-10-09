"use client";

import React, { useState } from "react";

export default function AdminProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error || !src || src.length < 5) {
    return (
      <div role="img" aria-label={`Sem foto de ${alt}`} className="w-full h-full bg-accent-soft flex items-center justify-center text-primary/40" title="Sem foto, ou a foto não carrega">
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">checkroom</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover" 
      onError={() => setError(true)}
    />
  );
}
