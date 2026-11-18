import { SIZE_GUIDE, isSameSize } from "@/lib/size-guide";

/** Tabela de medidas usada no FAQ e na janela da página do produto. */
export default function SizeGuideTable({ highlight }: { highlight?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-primary/10 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Medidas do corpo por tamanho</caption>
          <thead className="bg-accent-soft dark:bg-slate-800 text-primary font-semibold text-sm">
            <tr>
              <th scope="col" className="px-4 sm:px-6 py-4">Tamanho</th>
              <th scope="col" className="px-4 sm:px-6 py-4">Busto</th>
              <th scope="col" className="px-4 sm:px-6 py-4">Cintura</th>
              <th scope="col" className="px-4 sm:px-6 py-4">Quadril</th>
              <th scope="col" className="px-4 sm:px-6 py-4">Manequim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {SIZE_GUIDE.map((row) => {
              const selected = highlight ? isSameSize(highlight, row.size) : false;
              return (
                <tr
                  key={row.size}
                  aria-current={selected ? "true" : undefined}
                  className={selected ? "bg-accent-soft/70 dark:bg-slate-800" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}
                >
                  <th scope="row" className="px-4 sm:px-6 py-4 font-bold text-primary">
                    {row.size}
                    {selected && <span className="sr-only"> (tamanho escolhido)</span>}
                  </th>
                  <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.busto}</td>
                  <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.cintura}</td>
                  <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.quadril}</td>
                  <td className="px-4 sm:px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">{row.manequim}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
