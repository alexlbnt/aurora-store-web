// Só para páginas do servidor (usa o Prisma diretamente).
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inactiveCutoff } from "@/lib/customer-activity";

/** Mesmos campos da busca da lista de clientes. */
export function customerSearchWhere(q: string): Prisma.CustomerWhereInput {
  if (!q) return {};
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ],
  };
}

/** Clientes cuja última compra não cancelada é anterior ao corte, quem sumiu há mais tempo primeiro. */
async function inactiveGroups(q: string, now: Date) {
  return prisma.order.groupBy({
    by: ["customerId"],
    where: { status: { not: "CANCELED" }, ...(q ? { customer: customerSearchWhere(q) } : {}) },
    _max: { createdAt: true },
    having: { createdAt: { _max: { lt: inactiveCutoff(now) } } },
    orderBy: { _max: { createdAt: "asc" } },
  });
}

export async function countInactiveCustomers(now = new Date()): Promise<number> {
  return (await inactiveGroups("", now)).length;
}

export async function loadInactiveCustomerIds(opts: {
  q: string;
  page: number;
  pageSize: number;
  now?: Date;
}): Promise<{ ids: string[]; total: number }> {
  const groups = await inactiveGroups(opts.q, opts.now ?? new Date());
  const start = (opts.page - 1) * opts.pageSize;
  return {
    ids: groups.slice(start, start + opts.pageSize).map((g) => g.customerId),
    total: groups.length,
  };
}
