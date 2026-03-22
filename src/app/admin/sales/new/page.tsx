import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";

export default function NewOrderPage() {
  return (
    <AdminLayout>
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/sales" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="text-xl font-bold text-primary dark:text-white">Novo Pedido Manual</h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center min-h-[50vh] text-center shadow-sm">
          <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-4xl">construction</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Área em Construção</h3>
          <p className="text-slate-500 max-w-md mb-8">
            O módulo completo de criação manual de pedidos (Televendas) diretamente pelo painel administrativo será liberado na próxima atualização. 
            <br/><br/>
            Por enquanto, utilize a vitrine da loja para simular compras de clientes ou realizar testes.
          </p>
          <Link href="/catalog" target="_blank" className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
            <span className="material-symbols-outlined">storefront</span>
            Acessar Vitrine
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
