"use client";

import React, { useState } from "react";

export default function ProductGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full md:w-[55%] flex flex-col-reverse md:flex-row gap-4 h-full md:sticky md:top-24">
      <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24 shrink-0 snap-x">
        {images.map((img, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveIndex(idx)}
            className={`rounded overflow-hidden border-2 shrink-0 w-20 md:w-full snap-center transition-all ${idx === activeIndex ? 'border-primary dark:border-slate-500' : 'border-transparent opacity-60 hover:opacity-100 hover:border-primary/30'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-auto object-contain block" />
          </button>
        ))}
      </div>
      <div className="flex-1 relative cursor-zoom-in flex items-start justify-center">
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img src={images[activeIndex]} alt="Produto" className="w-full h-auto max-h-[85vh] object-contain transition-all duration-300 rounded-lg" />
         <button className="absolute bottom-4 right-4 bg-white/80 backdrop-blur size-10 flex items-center justify-center rounded-full text-primary hover:bg-white transition-colors shadow-sm">
           <span className="material-symbols-outlined">zoom_in</span>
         </button>
      </div>
    </div>
  );
}
