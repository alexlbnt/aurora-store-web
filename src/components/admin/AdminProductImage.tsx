"use client";

import React, { useState } from "react";

export default function AdminProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error || !src || src.length < 5) {
    return (
      <div className="w-full h-full bg-sky-50 flex items-center justify-center text-sky-400" title="Sem imagem ou imagem quebrada">
        <span className="material-symbols-outlined text-[22px]">dry_cleaning</span>
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
