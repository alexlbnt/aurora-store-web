"use client";

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProduct } from "./actions";
import { showToast } from "@/components/ui/Toast";
import QuickStockModal from "@/components/admin/products/QuickStockModal";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";

interface ProductRowActionsProps {
  productId: string;
  productName?: string;
  onStockUpdated?: () => void;
  onProductDeleted?: (id: string) => void;
}

const emptySubscribe = () => () => {};

export default function ProductRowActions({
  productId,
  productName = "Produto",
  onStockUpdated,
  onProductDeleted,
}: ProductRowActionsProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; openUpwards: boolean }>({
    top: 0,
    left: 0,
    openUpwards: false,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    // Close if the button is completely offscreen
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const menuHeight = 140;
    const menuWidth = 192;
    const margin = 6;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight + margin && rect.top > menuHeight + margin;

    const top = openUpwards ? Math.max(8, rect.top - menuHeight - margin) : rect.bottom + margin;

    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    setMenuStyle({ top, left, openUpwards });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const handleDelete = async () => {
    setIsOpen(false);
    const ok = await confirm({
      title: `Excluir ${productName}?`,
      description:
        "O produto e todas as variações de cor e tamanho saem do catálogo. Produtos que já têm vendas não podem ser excluídos. Não dá para desfazer.",
      confirmLabel: "Excluir produto",
      tone: "danger",
    });
    if (ok) {
      setIsDeleting(true);
      const res = await deleteProduct(productId);
      if (!res.success) {
        showToast(res.error || "Erro ao excluir produto", "error");
        setIsDeleting(false);
      } else {
        showToast("Produto excluído.", "success");
        if (onProductDeleted) onProductDeleted(productId);
        router.refresh();
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="inline-block text-left">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={isDeleting}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Ações do produto"
        className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">{isDeleting ? "sync" : "more_vert"}</span>
      </button>

      {isMounted &&
        isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${menuStyle.top}px`,
              left: `${menuStyle.left}px`,
              zIndex: 9999,
            }}
            className={`w-48 rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700/50 focus:outline-none overflow-hidden transition-all duration-100 ${
              menuStyle.openUpwards ? "origin-bottom-right" : "origin-top-right"
            }`}
          >
            <div className="py-1">
              <Link
                href={`/admin/products/${productId}/edit`}
                onClick={() => setIsOpen(false)}
                className="group flex w-full items-center gap-2 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary">
                  edit
                </span>
                Editar Produto
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsStockModalOpen(true);
                }}
                className="group flex w-full items-center gap-2 px-4 py-2.5 text-xs sm:text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-purple-500">tune</span>
                Ajustar Estoque
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="group flex w-full items-center gap-2 px-4 py-2.5 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-rose-400 group-hover:text-rose-600">
                  delete
                </span>
                Excluir Produto
              </button>
            </div>
          </div>,
          document.body
        )}

      <QuickStockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        productId={productId}
        productName={productName}
        onStockSaved={() => {
          if (onStockUpdated) onStockUpdated();
          router.refresh();
        }}
      />
    </div>
  );
}
