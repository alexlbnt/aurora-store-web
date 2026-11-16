// Uso único (v1.8.0): pedidos que já estavam Pago, Enviado ou Entregue antes do controle de
// recebimentos ganham um recebimento com o valor cheio, na data do pedido.
// Idempotente: só mexe em pedidos sem nenhum recebimento.
//   npx tsx scripts/backfill-payments.ts          -> mostra o que faria
//   npx tsx scripts/backfill-payments.ts --apply  -> grava
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] }, payments: { none: {} } },
    select: { id: true, orderNumber: true, status: true, totalAmount: true, paymentMethod: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const total = orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  console.log(`${orders.length} pedido(s) sem recebimento, somando R$ ${total.toFixed(2)}.`);
  if (!apply) {
    orders.slice(0, 10).forEach((o) => console.log(`  ${o.orderNumber} ${o.status} R$ ${Number(o.totalAmount).toFixed(2)}`));
    console.log("Nada gravado. Rode com --apply para gravar.");
    return;
  }

  const paid = orders.filter((o) => Number(o.totalAmount) > 0);
  const result = await prisma.orderPayment.createMany({
    data: paid.map((o) => ({
      orderId: o.id,
      amount: o.totalAmount,
      method: o.paymentMethod ?? "PIX",
      paidAt: o.createdAt,
      notes: "Recebimento migrado: pedido já estava pago antes do controle de recebimentos",
    })),
  });
  console.log(`${result.count} recebimento(s) criado(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
