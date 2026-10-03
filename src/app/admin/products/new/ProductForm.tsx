"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createProduct } from "./actions";
import { quickUpdateCategory, quickDeleteCategory } from "../actions";

export default function ProductForm({ categories, initialData }: { categories: any[], initialData?: any }) {
  const isEditing = !!initialData;
  const [isPending, setIsPending] = useState(false);
  const [hasVariants, setHasVariants] = useState(initialData ? initialData.variants.length > 0 : true);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialData?.categoryId || "");
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Derive initial unique sizes and colors from variants if editing
  const initialSizes = initialData 
    ? Array.from(new Set(initialData.variants.map((v: any) => v.size))) as string[]
    : ['P', 'M', 'G'];
  const initialColors = initialData
    ? Array.from(new Set(initialData.variants.map((v: any) => v.color))) as string[]
    : ['Padrão'];

  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [colors, setColors] = useState<string[]>(initialColors);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  const initialDetails = initialData?.details || [];
  const [details, setDetails] = useState<string[]>(initialDetails);
  const [newDetail, setNewDetail] = useState("");

  const initialImages = initialData?.images ? initialData.images.map((img: any) => typeof img === 'string' ? img : img.url) : [];
  const [images, setImages] = useState<string[]>(initialImages);
  const [newImage, setNewImage] = useState("");
  const [localFiles, setLocalFiles] = useState<{file: File, preview: string}[]>([]);

  const [variantMatrix, setVariantMatrix] = useState<any[]>(initialData?.variants || []);

  useEffect(() => {
    if (!hasVariants) return;
    const newMatrix: any[] = [];
    sizes.forEach(size => {
      colors.forEach(color => {
         const existingId = `${size}-${color}`;
         const existing = variantMatrix.find(v => v._id === existingId || (v.size === size && v.color === color));
         newMatrix.push({
           _id: existingId,
           size,
           color,
           sku: existing?.sku || `AUR-${size.substring(0,3).toUpperCase()}-${color.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
           price: existing?.price || '',
           stockA: existing?.stockA || 0,
           stockV: existing?.stockV || 0
         });
      });
    });
    // Only update if dimensions changed to avoid losing input focus
    if (newMatrix.length !== variantMatrix.length || !newMatrix.every((m, i) => m._id === variantMatrix[i]?._id)) {
       setVariantMatrix(newMatrix);
    }
  }, [sizes, colors, hasVariants]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateVariantElement = (id: string, field: string, value: string) => {
    setVariantMatrix(prev => prev.map(v => v._id === id ? { ...v, [field]: value } : v));
  };

  const commitSize = () => {
    if (newSize.trim() !== "") {
      if (!sizes.includes(newSize.trim().toUpperCase())) {
        setSizes([...sizes, newSize.trim().toUpperCase()]);
      }
      setNewSize("");
    }
  };

  const addSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitSize();
    }
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
  };

  const commitColor = () => {
    if (newColor.trim() !== "") {
      const colorFormatted = newColor.trim().charAt(0).toUpperCase() + newColor.trim().slice(1).toLowerCase();
      if (!colors.includes(colorFormatted)) {
        setColors([...colors, colorFormatted]);
      }
      setNewColor("");
    }
  };

  const addColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitColor();
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const commitDetail = () => {
    if (newDetail.trim() !== "") {
      setDetails([...details, newDetail.trim()]);
      setNewDetail("");
    }
  };

  const addDetail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDetail();
    }
  };

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const commitImage = () => {
    if (newImage.trim() !== "") {
      if (!images.includes(newImage.trim())) {
        setImages([...images, newImage.trim()]);
      }
      setNewImage("");
    }
  };

  const addImage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitImage();
    }
  };

  const removeImage = (url: string) => {
    setImages(images.filter(img => img !== url));
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback: se falhar o blob, envia o original
            }
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => {
          // Se o navegador não conseguir ler a imagem (ex: formato HEIC do iPhone/Samsung)
          if (file.size > 4.2 * 1024 * 1024) {
            reject(new Error("Formato de imagem não suportado (ex: HEIC) e arquivo muito grande (>4MB). Por favor, use JPG ou PNG."));
          } else {
            resolve(file); // Envia o original se for pequeno o suficiente
          }
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Captura o FormData de forma síncrona antes do primeiro 'await'
    // pois o e.currentTarget se perde após requisições assíncronas no React.
    const formData = new FormData(e.currentTarget);
    
    setIsPending(true);

    try {
      const uploadedUrls: string[] = [];
      for (const { file } of localFiles) {
        // Compress file to avoid "Request Entity Too Large" on Vercel
        const compressedFile = await compressImage(file);
        
        const fileData = new FormData();
        fileData.append('file', compressedFile);
        
        const res = await fetch('/api/upload', { method: 'POST', body: fileData });
        const text = await res.text(); // Read as text first to handle non-JSON errors like 413
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(res.ok ? "Erro ao processar resposta do servidor." : `Erro do servidor: ${text.substring(0, 40)}... (Imagem muito grande?)`);
        }
        
        if (!res.ok) {
          throw new Error(data.error || "Erro ao fazer upload da imagem. Você configurou a IMGBB_API_KEY no .env?");
        }
        uploadedUrls.push(data.url);
      }

      const finalImages = [...images, ...uploadedUrls];

      // Add variants data
      formData.append('images', JSON.stringify(finalImages));
      formData.append('variantsMatrix', JSON.stringify(variantMatrix));
      formData.append('hasVariants', String(hasVariants));
      formData.append('details', JSON.stringify(details));
      
      if (isEditing) {
        // Fetch dynamically from imported actions to avoid circular deps with new/actions.ts
        const { editProduct } = await import("../actions");
        const result = await editProduct(initialData.id, formData);
        if (result && !result.success) {
          throw new Error(result.error || "Erro ao editar produto.");
        }
      } else {
        const result = await createProduct(formData);
        if (result && !result.success) {
          throw new Error(result.error || "Erro ao criar produto.");
        }
      }
      // Redirect to list
      window.location.href = '/admin/products';
    } catch (error: any) {
      console.error("Failed to create/edit product:", error);
      const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      alert(msg || "Erro desconhecido ao processar produto.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-28 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/admin/products" className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium truncate">
            <Link href="/admin/products" className="text-slate-500 hover:text-primary transition-colors shrink-0">Produtos</Link>
            <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-400 shrink-0">chevron_right</span>
            <span className="text-slate-900 dark:text-white border-b-2 border-primary pb-0.5 truncate font-bold">{isEditing ? 'Editar' : 'Novo'}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/products" className="hidden sm:inline-flex px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'publish'}</span>
            <span>{isPending ? 'Salvando...' : (isEditing ? 'Salvar' : 'Publicar')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Info */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-white">Informações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    defaultValue={initialData?.name}
                    placeholder="Ex: Vestido de Seda Aurora" 
                    className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <textarea 
                      name="description"
                      rows={5} 
                      defaultValue={initialData?.description}
                      placeholder="Descreva os detalhes, materiais e cuidados do produto..." 
                      className="w-full border-none focus:ring-0 dark:bg-slate-800 dark:text-white p-3.5 text-sm resize-y outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Detalhes (Tópicos)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newDetail}
                      onChange={(e) => setNewDetail(e.target.value)}
                      onKeyDown={addDetail}
                      placeholder="Ex: Qualidade Premium" 
                      className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" 
                    />
                    <button
                      type="button"
                      onClick={commitDetail}
                      className="size-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold flex items-center justify-center shrink-0 cursor-pointer"
                      title="Adicionar detalhe"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {details.map((detail, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        {detail}
                        <button type="button" onClick={() => removeDetail(idx)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Imagens */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-white">Imagens do Produto</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URLs das Imagens ou Arquivo Local</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        onKeyDown={addImage}
                        placeholder="Cole a URL da imagem..." 
                        className="flex-1 rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" 
                      />
                      <button
                        type="button"
                        onClick={commitImage}
                        className="size-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold flex items-center justify-center shrink-0 cursor-pointer"
                        title="Adicionar URL"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                    </div>
                    <label className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-white px-4 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold border border-primary/20 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                      <span>Foto / Galeria</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files) {
                            const filesArray = Array.from(e.target.files);
                            const newLocalFiles = filesArray.map(file => ({
                              file,
                              preview: URL.createObjectURL(file)
                            }));
                            setLocalFiles(prev => [...prev, ...newLocalFiles]);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Pressione Enter para adicionar a URL ou clique em Galeria para escolher do computador.</p>
                </div>

                {(images.length > 0 || localFiles.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                     {images.map((url, i) => (
                       <div key={`url-${i}`} className="relative group rounded-xl border border-slate-200 overflow-hidden aspect-[3/4] bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Preview ${i}`} className="w-full h-full object-contain" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(url)} 
                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                       </div>
                     ))}
                     {localFiles.map((local, i) => (
                       <div key={`local-${i}`} className="relative group rounded-xl border border-slate-200 overflow-hidden aspect-[3/4] bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={local.preview} alt={`Local Preview ${i}`} className="w-full h-full object-contain" />
                          <button 
                            type="button" 
                            onClick={() => {
                              setLocalFiles(prev => {
                                const copy = [...prev];
                                URL.revokeObjectURL(copy[i].preview);
                                copy.splice(i, 1);
                                return copy;
                              });
                            }} 
                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Variations */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Variações</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Opcional</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  <span className="ms-3 text-sm font-medium text-slate-700 dark:text-slate-300">Produto com Variações</span>
                </label>
              </div>
              
              {hasVariants && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tamanhos</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          onKeyDown={addSize}
                          placeholder="Ex: P, M, G, 38, 40" 
                          className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-base sm:text-sm focus:ring-primary dark:text-white" 
                        />
                        <button
                          type="button"
                          onClick={commitSize}
                          className="size-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold flex items-center justify-center shrink-0 cursor-pointer"
                          title="Adicionar tamanho"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                      <div className="mt-1.5 text-xs text-slate-400">Digite e clique em + ou aperte Enter</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <span key={size} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg flex items-center gap-1.5 border border-primary/20">
                            {size}
                            <button type="button" onClick={() => removeSize(size)} className="hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Cores</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          onKeyDown={addColor}
                          placeholder="Ex: Preto, Branco, Azul" 
                          className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-base sm:text-sm focus:ring-primary dark:text-white" 
                        />
                        <button
                          type="button"
                          onClick={commitColor}
                          className="size-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold flex items-center justify-center shrink-0 cursor-pointer"
                          title="Adicionar cor"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                      <div className="mt-1.5 text-xs text-slate-400">Digite e clique em + ou aperte Enter</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <span key={color} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg flex items-center gap-1.5 border border-primary/20">
                            {color}
                            <button type="button" onClick={() => removeColor(color)} className="hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sizes.length > 0 && colors.length > 0 && (
                     <div className="mt-8">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Matriz de Variações ({variantMatrix.length})</h4>
                       
                       {/* Mobile Variant Cards (< sm) */}
                       <div className="sm:hidden space-y-3">
                         {variantMatrix.map((v) => (
                           <div key={v._id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded">
                                   {v.size}
                                 </span>
                                 <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                   {v.color}
                                 </span>
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-2">
                               <div>
                                 <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">SKU</label>
                                 <input 
                                   type="text" 
                                   value={v.sku} 
                                   onChange={e => updateVariantElement(v._id, 'sku', e.target.value)} 
                                   placeholder="SKU"
                                   className="w-full text-xs py-1.5 px-2 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" 
                                 />
                                </div>
                                <div>
                                 <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Preço (R$)</label>
                                 <input 
                                   type="number" 
                                   step="0.01" 
                                   value={v.price} 
                                   onChange={e => updateVariantElement(v._id, 'price', e.target.value)} 
                                   placeholder="Base" 
                                   className="w-full text-xs py-1.5 px-2 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" 
                                 />
                                </div>
                                <div>
                                 <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Estoque A</label>
                                 <input 
                                   type="number" 
                                   value={v.stockA} 
                                   onChange={e => updateVariantElement(v._id, 'stockA', e.target.value)} 
                                   className="w-full text-xs py-1.5 px-2 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" 
                                 />
                                </div>
                                <div>
                                 <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Estoque V</label>
                                 <input 
                                   type="number" 
                                   value={v.stockV} 
                                   onChange={e => updateVariantElement(v._id, 'stockV', e.target.value)} 
                                   className="w-full text-xs py-1.5 px-2 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" 
                                 />
                                </div>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Desktop Table (>= sm) */}
                       <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                             <tr>
                               <th className="px-4 py-3 font-bold text-slate-500">Tamanho</th>
                               <th className="px-4 py-3 font-bold text-slate-500">Cor</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-32">SKU</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-32">Preço (+/-)</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-24">Estoque A</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-24">Estoque V</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {variantMatrix.map((v) => (
                               <tr key={v._id}>
                                 <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{v.size}</td>
                                 <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{v.color}</td>
                                 <td className="px-4 py-2">
                                   <input type="text" value={v.sku} onChange={e => updateVariantElement(v._id, 'sku', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary" />
                                 </td>
                                 <td className="px-4 py-2">
                                   <input type="number" step="0.01" value={v.price} onChange={e => updateVariantElement(v._id, 'price', e.target.value)} placeholder="Base" className="w-full text-xs py-1.5 px-2 rounded border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary" />
                                 </td>
                                 <td className="px-4 py-2">
                                   <input type="number" value={v.stockA} onChange={e => updateVariantElement(v._id, 'stockA', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary" />
                                 </td>
                                 <td className="px-4 py-2">
                                   <input type="number" value={v.stockV} onChange={e => updateVariantElement(v._id, 'stockV', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary" />
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                       <p className="text-xs text-slate-400 mt-2">Dica: Deixe o preço em branco para usar o Preço Base.</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Card 3: Organization */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-white">Organização</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <select name="categoryId" value={selectedCategoryId} onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setIsNewCategory(e.target.value === 'NEW');
                      setIsEditingCategory(false);
                    }} className="flex-1 min-w-0 rounded-lg border-slate-200 text-base sm:text-sm focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                      <option value="" disabled>Selecione uma categoria...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                      <option value="NEW" className="font-bold text-primary">+ Nova Categoria</option>
                    </select>
                    {selectedCategoryId && selectedCategoryId !== 'NEW' && !isEditingCategory && (
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <button type="button" onClick={() => {
                          setIsEditingCategory(true);
                          setEditingCategoryName(categories.find(c => c.id === selectedCategoryId)?.name || "");
                        }} className="p-1.5 sm:p-2 text-slate-400 hover:text-primary transition-colors rounded-md hover:bg-slate-50 dark:hover:bg-slate-800" title="Editar Categoria">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button type="button" onClick={async () => {
                          if (confirm("Tem certeza que deseja excluir esta categoria?")) {
                            const res = await quickDeleteCategory(selectedCategoryId);
                            if (res?.error) alert(res.error);
                            else { setSelectedCategoryId(""); setIsNewCategory(false); }
                          }
                        }} className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Excluir Categoria">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditingCategory && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <input type="text" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-1 min-w-0 rounded-lg border-slate-200 text-base sm:text-sm p-2 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={async () => {
                          const res = await quickUpdateCategory(selectedCategoryId, editingCategoryName);
                          if (res?.error) alert(res.error);
                          else setIsEditingCategory(false);
                        }} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors text-center">Salvar</button>
                        <button type="button" onClick={() => setIsEditingCategory(false)} className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors text-center">Cancelar</button>
                      </div>
                    </div>
                  )}
                  {isNewCategory && (
                    <input 
                      type="text" 
                      name="newCategoryName" 
                      placeholder="Nome da nova categoria" 
                      required 
                      className="w-full mt-2 rounded-lg border-slate-200 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400 text-base sm:text-sm" 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-accent-cream dark:bg-slate-800/50 p-4 sm:p-6 rounded-xl border border-primary/20 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-primary dark:text-primary/80">Preço &amp; Estoque Base</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" name="price" defaultValue={initialData?.basePrice} required placeholder="0.00" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400 text-base sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estoque A (Base)</label>
                  {hasVariants ? (
                    <input type="number" name="stockA" value={variantMatrix.reduce((acc, v) => acc + (Number(v.stockA) || 0), 0)} readOnly className="w-full rounded-lg border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" />
                  ) : (
                    <input type="number" name="stockA" defaultValue={initialData ? initialData.variants.reduce((acc: number, v: any) => acc + v.stockA, 0) : undefined} required placeholder="0" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400 text-base sm:text-sm" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estoque V (Base)</label>
                  {hasVariants ? (
                    <input type="number" name="stockV" value={variantMatrix.reduce((acc, v) => acc + (Number(v.stockV) || 0), 0)} readOnly className="w-full rounded-lg border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-white text-base sm:text-sm" />
                  ) : (
                    <input type="number" name="stockV" defaultValue={initialData ? initialData.variants.reduce((acc: number, v: any) => acc + v.stockV, 0) : undefined} required placeholder="0" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400 text-base sm:text-sm" />
                  )}
                </div>
              </div>

              {/* Desktop card submit button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{isPending ? 'sync' : 'publish'}</span>
                <span>{isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Publicar Produto')}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar for Mobile (< lg) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 shadow-lg">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">{isPending ? 'sync' : 'publish'}</span>
          <span>{isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Publicar Produto')}</span>
        </button>
      </div>
    </form>
  );
}
