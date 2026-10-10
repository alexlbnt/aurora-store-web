import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import StatusUpdater from "@/components/admin/sales/StatusUpdater";
import ShippingUpdater from "@/components/admin/sales/ShippingUpdater";
import OrderNotesCard from "@/components/admin/sales/OrderNotesCard";
import AdminProductImage from "@/components/admin/AdminProductImage";
import { StockBadge } from "@/components/admin/ui/StatusBadge";
import { formatBRL, formatDateTime, whatsappToCustomer } from "@/lib/format";
import { PAYMENT_LABEL, SHIPPING_LABEL } from "@/lib/order-meta";

const cardClass = "rounded-lg border border-primary/10 bg-white p-4 sm:p-6";
const cardTitleClass = "mb-4 flex items-center gap-2 text-lg font-semibold text-primary";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const param = await params;
  const order = await prisma.order.findUnique({
    where: { id: param.id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: { images: true },
          },
        },
      },
    },
  });

  if (!order) return notFound();

  const variantIds = order.items.map((i) => i.variantId).filter(Boolean) as string[];
  const variants =
    variantIds.length > 0
      ? await prisma.variant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, color: true, size: true, sku: true },
        })
      : [];
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const itemsText = order.items
    .map((item) => {
      const v = item.variantId ? variantMap.get(item.variantId) : null;
      const vInfo = v ? ` (${v.color} - ${v.size})` : "";
      return `▫️ ${item.quantity}x ${item.product.name}${vInfo} - ${formatBRL(Number(item.price) * item.quantity)}`;
    })
    .join("\n");

  const discount = Number(order.discountAmount || 0);
  const subtotal = Number(order.totalAmount) + discount;

  let receiptText = `*Resumo do pedido:*\n${itemsText}\n\n`;
  if (discount > 0) {
    receiptText += `Subtotal: ${formatBRL(subtotal)}\n`;
    receiptText += `Desconto: - ${formatBRL(discount)}\n`;
  }
  receiptText += `*Total: ${formatBRL(order.totalAmount)}*\n`;
  receiptText += `Frete: ${SHIPPING_LABEL[order.shippingType] || "Sem frete"}\n`;
  if (order.notes) receiptText += `Observações: ${order.notes}\n`;

  const textMessage = `Olá, ${order.customer.name}! Recebemos o seu pedido ${order.orderNumber}.\n\n${receiptText}\nVamos combinar os próximos passos por aqui. Muito obrigada pela preferência!`;
  const waLink = whatsappToCustomer(order.customer.phone, textMessage);
  const waPlainLink = whatsappToCustomer(order.customer.phone);

  // Pedido do site traz o endereço no próprio pedido; o do painel usa o cadastro do cliente, se houver.
  const address = order.shippingAddress || order.customer.address;
  const city = order.shippingCity || order.customer.city;
  const state = order.shippingState || order.customer.state;
  const cep = order.shippingCep || order.customer.cep;
  const hasAddress = Boolean(address || city || cep);
  const addressText = [address, [city, state].filter(Boolean).join(" - "), cep].filter(Boolean).join("\n");

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/admin/sales"
            className="mb-2 flex w-max items-center gap-1 text-sm text-accent-blue underline-offset-4 hover:text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            Voltar para vendas
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-2xl font-semibold text-primary">Pedido {order.orderNumber}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-primary/70">{formatDateTime(order.createdAt)}</span>
              <StockBadge location={order.stockLocation} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Link
            href={`/admin/sales/${order.id}/edit`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-blue"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
            Editar pedido
          </Link>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Enviar resumo no WhatsApp</span>
            </a>
          )}
          <div className="col-span-2 sm:col-span-1">
            <StatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={cardClass} aria-labelledby="itens">
            <h2 id="itens" className={cardTitleClass}>
              <span className="material-symbols-outlined text-primary" aria-hidden="true">inventory_2</span>
              Itens do pedido ({order.items.length})
            </h2>
            <ul className="divide-y divide-primary/10">
              {order.items.map((item) => {
                const v = item.variantId ? variantMap.get(item.variantId) : null;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/10 bg-accent-soft sm:size-16">
                      <AdminProductImage
                        src={item.product.images && item.product.images.length > 0 ? item.product.images[0].url : ""}
                        alt={item.product.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-primary">{item.product.name}</p>
                      <p className="mt-0.5 text-sm text-primary/70">
                        {item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}
                        {v && ` · ${v.color}, tamanho ${v.size}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-primary">{formatBRL(Number(item.price) * item.quantity)}</p>
                      {item.quantity > 1 && <p className="mt-0.5 text-sm text-primary/60">{formatBRL(item.price)} cada</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="-mx-4 -mb-4 mt-6 flex flex-col gap-2 rounded-b-lg border-t border-primary/10 bg-accent-cream p-4 sm:-mx-6 sm:-mb-6 sm:p-6">
              {discount > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm text-primary/70">
                    <dt>Subtotal</dt>
                    <dd>{formatBRL(subtotal)}</dd>
                  </div>
                  <div className="flex items-center justify-between text-sm text-primary/70">
                    <dt>Desconto</dt>
                    <dd>− {formatBRL(discount)}</dd>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-primary">Total do pedido</dt>
                <dd className="text-2xl font-semibold text-primary">{formatBRL(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className={cardClass} aria-labelledby="cliente">
            <h2 id="cliente" className={cardTitleClass}>
              <span className="material-symbols-outlined text-primary" aria-hidden="true">person</span>
              Cliente
            </h2>
            <div className="mb-4 flex items-center gap-3">
              <Link
                href={`/admin/customers/${order.customer.id}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-primary transition-colors hover:bg-primary/15"
                aria-label={`Abrir o cadastro de ${order.customer.name}`}
                title="Abrir o cadastro do cliente"
              >
                {order.customer.name.substring(0, 2).toUpperCase()}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="block truncate font-medium text-primary hover:underline"
                >
                  {order.customer.name}
                </Link>
                <p className="truncate text-sm text-primary/70">{order.customer.email || "Sem e-mail cadastrado"}</p>
              </div>
            </div>
            {order.customer.phone && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 rounded-lg bg-accent-cream p-3 text-sm text-primary">
                  <span className="material-symbols-outlined text-base text-primary/60" aria-hidden="true">call</span>
                  <span className="font-medium">{order.customer.phone}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {waPlainLink && (
                    <a
                      href={waPlainLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-primary/25 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                      WhatsApp
                    </a>
                  )}
                  <a
                    href={`tel:${order.customer.phone.replace(/\D/g, "")}`}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-primary/25 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">call</span>
                    Ligar
                  </a>
                </div>
              </div>
            )}
          </section>

          <section className={cardClass} aria-labelledby="entrega">
            <h2 id="entrega" className={cardTitleClass}>
              <span className="material-symbols-outlined text-primary" aria-hidden="true">local_shipping</span>
              Entrega e pagamento
            </h2>
            {hasAddress ? (
              <p className="mb-4 whitespace-pre-line rounded-lg bg-accent-cream p-3 text-sm text-primary">{addressText}</p>
            ) : (
              <p className="mb-4 rounded-lg bg-accent-cream p-3 text-sm text-primary/70">
                Sem endereço neste pedido. Combine a entrega com o cliente.
              </p>
            )}
            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-primary/70">Pagamento</dt>
                <dd className="font-medium text-primary">
                  {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod : "A combinar"}
                </dd>
              </div>
            </dl>
            <ShippingUpdater orderId={order.id} currentShipping={order.shippingType as "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE"} />
          </section>

          <OrderNotesCard orderId={order.id} initialNotes={order.notes} />
        </div>
      </div>
    </AdminLayout>
  );
}
