import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsClientForm from "./SettingsClientForm";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const session = await auth();

  let adminUser = null;
  let productsCount = 0;
  let ordersCount = 0;
  let customersCount = 0;

  try {
    const [user, pCount, oCount, cCount] = await Promise.all([
      session?.user?.email
        ? prisma.user.findUnique({
            where: { email: session.user.email },
            select: { name: true, email: true, role: true },
          })
        : null,
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
    ]);

    adminUser = user;
    productsCount = pCount;
    ordersCount = oCount;
    customersCount = cCount;
  } catch (error) {
    console.error("Erro ao carregar configurações de administrador:", error);
  }

  const initialData = {
    name: adminUser?.name || session?.user?.name || "Administrador",
    email: adminUser?.email || session?.user?.email || "admin@aurora.com.br",
    role: adminUser?.role || "ADMIN",
    productsCount,
    ordersCount,
    customersCount,
  };

  return (
    <AdminLayout pageTitle="Configurações">
      <div className="flex-1 pb-12">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-primary">Configurações Gerais</h2>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie seu perfil de acesso, parâmetros da loja e monitore os serviços integrados.
          </p>
        </div>

        <SettingsClientForm initialData={initialData} />
      </div>
    </AdminLayout>
  );
}
