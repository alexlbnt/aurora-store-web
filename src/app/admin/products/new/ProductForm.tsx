"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createProduct } from "./actions";

export default function ProductForm({ categories, initialData }: { categories: any[], initialData?: any }) {
  const isEditing = !!initialData;
  const [isPending, setIsPending] = useState(false);
  const [hasVariants, setHasVariants] = useState(initialData ? initialData.variants.length > 0 : true);

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

  const initialImages = initialData?.images ? initialData.images.map((img: any) => typeof img === 'string' ? img : img.url) : [];
  const [images, setImages] = useState<string[]>(initialImages);
  const [newImage, setNewImage] = useState("");

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
           stock: existing?.stock || 0
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

  const addSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSize.trim() !== "") {
      e.preventDefault();
      if (!sizes.includes(newSize.trim().toUpperCase())) {
        setSizes([...sizes, newSize.trim().toUpperCase()]);
      }
      setNewSize("");
    }
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
  };

  const addColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newColor.trim() !== "") {
      e.preventDefault();
      const colorFormatted = newColor.trim().charAt(0).toUpperCase() + newColor.trim().slice(1).toLowerCase();
      if (!colors.includes(colorFormatted)) {
        setColors([...colors, colorFormatted]);
      }
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const addImage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newImage.trim() !== "") {
      e.preventDefault();
      if (!images.includes(newImage.trim())) {
        setImages([...images, newImage.trim()]);
      }
      setNewImage("");
    }
  };

  const removeImage = (url: string) => {
    setImages(images.filter(img => img !== url));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    
    // Add variants data
    formData.append('images', JSON.stringify(images));
    formData.append('variantsMatrix', JSON.stringify(variantMatrix));
    formData.append('hasVariants', String(hasVariants));
    
    try {
      if (isEditing) {
        // Fetch dynamically from imported actions to avoid circular deps with new/actions.ts
        const { editProduct } = await import("../actions");
        await editProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }
      // Redirect to list
      window.location.href = '/admin/products';
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Erro ao criar produto. Verifique os campos.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/admin" className="text-slate-500 hover:text-primary transition-colors">Dashboard</Link>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
            <span className="text-slate-900 dark:text-white">{isEditing ? 'Editar Produto' : 'Novo Produto'}</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'publish'}</span>
            {isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Publicar Produto')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Info */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Informações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    defaultValue={initialData?.name}
                    placeholder="Ex: Vestido de Seda Aurora" 
                    className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <textarea 
                      name="description"
                      rows={6} 
                      defaultValue={initialData?.description}
                      placeholder="Descreva os detalhes, materiais e cuidados do produto..." 
                      className="w-full border-none focus:ring-0 dark:bg-slate-800 dark:text-white p-4 text-sm resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Imagens */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Imagens do Produto</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URLs das Imagens</label>
                  <input 
                    type="text" 
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    onKeyDown={addImage}
                    placeholder="Cole a URL da imagem e aperte Enter..." 
                    className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  />
                  <p className="text-xs text-slate-400 mt-2">Pressione Enter para adicionar a URL à galeria.</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                     {images.map((url, i) => (
                       <div key={i} className="relative group rounded-xl border border-slate-200 overflow-hidden aspect-[3/4] bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(url)} 
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Variações</h3>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Opcional</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  <span className="ms-3 text-sm font-medium text-slate-700 dark:text-slate-300">Produto com Variações</span>
                </label>
              </div>
              
              {hasVariants && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tamanhos</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          onKeyDown={addSize}
                          placeholder="Digite e aperte Enter..." 
                          className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" 
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Pressione Enter para adicionar</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <span key={size} className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded flex items-center gap-1">
                            {size}
                            <button type="button" onClick={() => removeSize(size)}><span className="material-symbols-outlined text-[12px] hover:text-red-500">close</span></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cores</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          onKeyDown={addColor}
                          placeholder="Digite e aperte Enter..." 
                          className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" 
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Pressione Enter para adicionar</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <span key={color} className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded flex items-center gap-1">
                            {color}
                            <button type="button" onClick={() => removeColor(color)}><span className="material-symbols-outlined text-[12px] hover:text-red-500">close</span></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {sizes.length > 0 && colors.length > 0 && (
                     <div className="mt-8">
                       <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Matriz de Variações</h4>
                       <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                             <tr>
                               <th className="px-4 py-3 font-bold text-slate-500">Tamanho</th>
                               <th className="px-4 py-3 font-bold text-slate-500">Cor</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-32">SKU</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-32">Preço (+/-)</th>
                               <th className="px-4 py-3 font-bold text-slate-500 w-24">Estoque</th>
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
                                   <input type="number" value={v.stock} onChange={e => updateVariantElement(v._id, 'stock', e.target.value)} className="w-full text-xs py-1.5 px-2 rounded border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-1 focus:ring-primary" />
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Organização</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <select name="categoryId" defaultValue={initialData?.categoryId} className="w-full rounded-lg border-slate-200 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-accent-cream dark:bg-slate-800/50 p-6 rounded-xl border border-primary/20 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-primary dark:text-primary/80">Preço &amp; Estoque Base</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" name="price" defaultValue={initialData?.basePrice} required placeholder="0.00" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Estoque Total</label>
                  <input type="number" name="stock" defaultValue={initialData ? initialData.variants.reduce((acc: number, v: any) => acc + v.stock, 0) : undefined} required placeholder="0" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
}
