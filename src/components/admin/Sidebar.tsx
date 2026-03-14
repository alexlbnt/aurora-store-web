import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "./actions";

export default async function Sidebar() {
  const session = await auth();
  
  return (
    <aside className="w-64 bg-background-dark text-slate-100 flex flex-col border-r border-primary/20 shrink-0 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-white">flare</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">Aurora</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link href="/admin/sales" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="text-sm font-medium">Vendas</span>
        </Link>
        <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-sm font-medium">Produtos</span>
        </Link>
        <Link href="/admin/customers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">group</span>
          <span className="text-sm font-medium">Clientes</span>
        </Link>
        <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="text-sm font-medium">Relatórios</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-primary/10">
        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-primary/20 hover:text-white transition-colors">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-medium">Configurações</span>
        </Link>
        <div className="mt-4 flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/30 flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100">{session?.user?.name || "Administrador"}</span>
              <span className="text-[10px] text-slate-500 uppercase">{session?.user?.email || "admin@aurora.com"}</span>
            </div>
          </div>
          <form action={logout}>
            <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 transition-colors" title="Sair do painel">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
