"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { deleteProduct } from "./actions";

interface ProductRowActionsProps {
  productId: string;
}

export default function ProductRowActions({ productId }: ProductRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleDelete = async () => {
    if (window.confirm("Atenção: Você tem certeza que deseja excluir permanentemente este produto e todas as suas variações de estoque?")) {
      setIsDeleting(true);
      const res = await deleteProduct(productId);
      if (!res.success) {
        alert(res.error);
        setIsDeleting(false);
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDeleting}
        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 disabled:opacity-50 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-[20px]">{isDeleting ? 'sync' : 'more_vert'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700/50 focus:outline-none z-50 overflow-hidden">
          <div className="py-1">
            {/* Future edit route link */}
            <Link 
              href={`/admin/products/${productId}/edit`}
              onClick={() => setIsOpen(false)}
              className="group flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary">edit</span>
              Editar Produto
            </Link>
            
            <button 
              onClick={handleDelete}
              className="group flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-400 group-hover:text-rose-600">delete</span>
              Excluir Produto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
