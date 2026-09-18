"use client";

import { useState } from "react";
import { updateOrderNotes } from "@/app/admin/sales/actions";

interface OrderNotesCardProps {
  orderId: string;
  initialNotes: string | null;
}

export default function OrderNotesCard({ orderId, initialNotes }: OrderNotesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [isPending, setIsPending] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(initialNotes || "");

  const handleSave = async () => {
    setIsPending(true);
    const res = await updateOrderNotes(orderId, notes);
    if (res.error) {
      alert(res.error);
    } else {
      setCurrentNotes(notes);
      setIsEditing(false);
    }
    setIsPending(false);
  };

  const handleCancel = () => {
    setNotes(currentNotes);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          Observações do Pedido
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            {currentNotes ? "Editar" : "Adicionar"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Digite particularidades ou observações deste pedido..."
            rows={3}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-bold bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      ) : currentNotes ? (
        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
          {currentNotes}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">
          Nenhuma particularidade ou observação registrada para este pedido.
        </p>
      )}
    </div>
  );
}
