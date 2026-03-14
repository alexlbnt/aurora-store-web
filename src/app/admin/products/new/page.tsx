import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";

export default function NewProduct() {
  return (
    <AdminLayout>
      {/* Header Inline Override for Products */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/admin/products" className="text-slate-500 hover:text-primary transition-colors">Produtos</Link>
            <span className="material-symbols-outlined text-xs text-slate-400">chevron_right</span>
            <span className="text-slate-900 dark:text-white">Novo Produto</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Descartar
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-sm">publish</span>
            Publicar Produto
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
                    placeholder="Ex: Vestido de Seda Aurora" 
                    className="w-full rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-3 py-2 flex gap-2">
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">format_bold</span></button>
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">format_italic</span></button>
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">format_list_bulleted</span></button>
                      <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"><span className="material-symbols-outlined text-sm">link</span></button>
                    </div>
                    <textarea 
                      rows={6} 
                      placeholder="Descreva os detalhes, materiais e cuidados do produto..." 
                      className="w-full border-none focus:ring-0 dark:bg-slate-800 dark:text-white p-4 text-sm resize-y"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Media (Simplified for React mapping) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mídia</h3>
                <button className="text-primary text-sm font-semibold hover:underline">Adicionar por URL</button>
              </div>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">add_photo_alternate</span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-center">Arraste as fotos aqui ou <span className="text-primary cursor-pointer hover:underline">procure no computador</span></p>
                <p className="text-xs text-slate-400 mt-1">Recomendado: 1200x1600px, JPG ou PNG</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg relative group overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBL8XW4HnEidRY0gyO8So9J1ZmhW2g4QcrjdY12Mp0ZOGkQeuNG6CkGMxQTkeW6k4EEd574ZcNVdqcuvfc8qyIahI4q9uwnCc3poLRXMBKCI_IG9P5av5Qzvoee8mLF5PGrynI-R3d_F36R1Q4gPU_ANV2wG8CPDkph717DFa-7rcJoD88xXvIHjKDVOq2wrY_ZnMT_Wq1o09LmaUE1q4-8MGF_bywoUcutUseg0WrikqTNV3ALa1RDyUj3HI85nIBEkNGvf1zVkj8")' }} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="text-white p-1 hover:bg-white/20 rounded transition-colors"><span className="material-symbols-outlined">delete</span></button>
                    <button className="text-white p-1 hover:bg-white/20 rounded transition-colors"><span className="material-symbols-outlined">visibility</span></button>
                  </div>
                </div>
                <div className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">add</span>
                </div>
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
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  <span className="ms-3 text-sm font-medium text-slate-700 dark:text-slate-300">Produto com Variações</span>
                </label>
              </div>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opção 1</label>
                    <div className="flex gap-2">
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        Tamanho <span className="material-symbols-outlined text-sm cursor-pointer hover:text-red-500">close</span>
                      </div>
                      <input type="text" placeholder="Adicionar valores..." className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">P</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">M</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">G</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opção 2</label>
                    <div className="flex gap-2">
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        Cor <span className="material-symbols-outlined text-sm cursor-pointer hover:text-red-500">close</span>
                      </div>
                      <input type="text" placeholder="Adicionar valores..." className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm focus:ring-primary dark:text-white" />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">Pérola</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">Champagne</span>
                    </div>
                  </div>
                </div>
                
                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Variante</th>
                        <th className="px-4 py-3">Preço (R$)</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Estoque</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">P / Pérola</td>
                        <td className="px-4 py-3"><input type="text" defaultValue="289,00" className="w-24 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><input type="text" defaultValue="AUR-PRL-P" className="w-28 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs uppercase focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><input type="number" defaultValue={12} className="w-20 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide">ATIVO</span></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">M / Pérola</td>
                        <td className="px-4 py-3"><input type="text" defaultValue="289,00" className="w-24 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><input type="text" defaultValue="AUR-PRL-M" className="w-28 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs uppercase focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><input type="number" defaultValue={8} className="w-20 p-1.5 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded text-xs focus:ring-primary focus:border-primary" /></td>
                        <td className="px-4 py-3"><span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide">ATIVO</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
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
                  <select className="w-full rounded-lg border-slate-200 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <option>Vestidos</option>
                    <option>Blusas</option>
                    <option>Calças</option>
                    <option>Acessórios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Coleção</label>
                  <select className="w-full rounded-lg border-slate-200 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <option>Aurora Primavera 2024</option>
                    <option>Clássicos Atemporais</option>
                    <option>Edição Limitada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                  <input type="text" placeholder="Seda, Longo, Festa..." className="w-full rounded-lg border-slate-200 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-accent-cream dark:bg-slate-800/50 p-6 rounded-xl border border-primary/20 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-primary dark:text-primary/80">Preço &amp; SKU Geral</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço Base (R$)</label>
                  <input type="text" placeholder="0,00" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU Mestre</label>
                  <input type="text" placeholder="Ex: AUR-VST-001" className="w-full rounded-lg border-primary/20 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 dark:text-white uppercase placeholder:text-slate-400" />
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="tax" className="rounded text-primary focus:ring-primary border-primary/30" />
                    <label htmlFor="tax" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Cobrar impostos sobre este produto</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Status */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Visibilidade</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <input type="radio" name="status" defaultChecked className="mt-0.5 text-primary focus:ring-primary border-slate-300" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Publicado</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Visível para todos os clientes</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <input type="radio" name="status" className="mt-0.5 text-primary focus:ring-primary border-slate-300" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Rascunho</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Apenas administradores podem ver</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <input type="radio" name="status" className="mt-0.5 text-primary focus:ring-primary border-slate-300" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Agendado</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Publicar em data específica</p>
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
