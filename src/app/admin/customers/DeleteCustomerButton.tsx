"use client";

import { useState } from "react";
import { deleteCustomer } from "./actions";

export default function DeleteCustomerButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    
    setIsDeleting(true);
    const result = await deleteCustomer(id);
    
    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
    }
    // if success, the page will revalidate automatically
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50" 
      title="Excluir"
    >
      <span className="material-symbols-outlined text-lg">{isDeleting ? 'sync' : 'delete'}</span>
    </button>
  );
}
