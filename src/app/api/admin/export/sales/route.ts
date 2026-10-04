import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTableImport from "jspdf-autotable";

const autoTable = (typeof autoTableImport === "function" ? autoTableImport : (autoTableImport as any).default) as typeof autoTableImport;

export const dynamic = "force-dynamic";

const formatStatus = (status: string) => {
  switch (status) {
    case "PAID":
      return "Pago";
    case "DELIVERED":
      return "Entregue";
    case "SHIPPED":
      return "Enviado";
    case "PENDING":
      return "Pendente";
    case "CANCELED":
      return "Cancelado";
    default:
      return status;
  }
};

const formatPaymentMethod = (pm?: string | null) => {
  switch (pm) {
    case "PIX":
      return "PIX";
    case "CREDIT_CARD":
      return "Cartão de Crédito";
    case "DEBIT_CARD":
      return "Cartão de Débito";
    case "BOLETO":
      return "Boleto Bancário";
    case "CASH":
      return "Dinheiro";
    case "BANK_TRANSFER":
      return "Transferência";
    case "OTHER":
      return "Outro";
    default:
      return pm || "N/A";
  }
};

const formatShippingType = (st?: string | null) => {
  switch (st) {
    case "SEM_FRETE":
      return "Sem Frete (Retirada)";
    case "PAGO_AURORA":
      return "Pago Aurora (Grátis)";
    case "PAGO_CLIENTE":
      return "Pago pelo Cliente";
    case "CORREIOS_PAC":
      return "Correios PAC";
    case "CORREIOS_SEDEX":
      return "Correios SEDEX";
    case "MOTOBOY":
      return "Motoboy";
    case "RETIRADA":
      return "Retirada";
    case "TRANSPORTADORA":
      return "Transportadora";
    default:
      return st || "Padrão";
  }
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const formattedNow = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // 1. Export in PDF Format
  if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background Box
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(14, 10, pageWidth - 28, 20, "F");

    // Header Top Gold Border Line
    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(14, 10, pageWidth - 28, 1.5, "F");

    // Store Logo / Brand Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text("AURORA STORE", 20, 22);

    // Document Title
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("RELATÓRIO GERAL DE VENDAS", 75, 22);

    // Meta emission info on right side
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Emissão: ${formattedNow}`, pageWidth - 20, 18, { align: "right" });
    const adminName = session.user?.name || "Administrador";
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Gerado por: ${adminName}`, pageWidth - 20, 23, { align: "right" });

    // Calculate Summary Metrics
    const nonCanceledOrders = orders.filter((o) => o.status !== "CANCELED");
    const totalSales = nonCanceledOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const totalOrdersCount = orders.length;
    const ticketMedio = nonCanceledOrders.length > 0 ? totalSales / nonCanceledOrders.length : 0;
    const paidCount = orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED").length;
    const pendingCount = orders.filter((o) => o.status === "PENDING" || o.status === "SHIPPED").length;
    const canceledCount = orders.filter((o) => o.status === "CANCELED").length;

    // Draw KPI Summary Cards
    const kpiY = 34;
    const cardWidth = (pageWidth - 28 - 9) / 4;
    const cards = [
      {
        title: "FATURAMENTO TOTAL",
        value: `R$ ${totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sub: "Pedidos válidos e concluídos",
        highlightColor: [5, 150, 105], // emerald-600
      },
      {
        title: "TOTAL DE PEDIDOS",
        value: `${totalOrdersCount} ${totalOrdersCount === 1 ? "pedido" : "pedidos"}`,
        sub: "Histórico completo cadastrado",
        highlightColor: [15, 23, 42],
      },
      {
        title: "TICKET MÉDIO",
        value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sub: "Média por pedido válido",
        highlightColor: [217, 119, 6], // amber-600
      },
      {
        title: "STATUS GERAL",
        value: `${paidCount} Pagos / Entregues`,
        sub: `${pendingCount} Pendentes • ${canceledCount} Cancelados`,
        highlightColor: [15, 23, 42],
      },
    ];

    cards.forEach((c, idx) => {
      const x = 14 + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, kpiY, cardWidth, 18, 2, 2, "FD");

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(c.title, x + 4, kpiY + 5);

      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(c.highlightColor[0], c.highlightColor[1], c.highlightColor[2]);
      doc.text(c.value, x + 4, kpiY + 11);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(c.sub, x + 4, kpiY + 15.5);
    });

    // Build Table Body
    const tableRows = orders.map((o) => {
      const orderDate = new Date(o.createdAt).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const customerName = o.customer?.name || "Cliente Desconhecido";
      const customerContact = [o.customer?.phone, o.shippingCity || o.customer?.city].filter(Boolean).join(" • ");
      const totalItems = o.items.reduce((acc, i) => acc + i.quantity, 0);
      const itemsLabel = `${totalItems} ${totalItems === 1 ? "item" : "itens"}`;
      const payment = formatPaymentMethod(o.paymentMethod);
      const totalFormatted = `R$ ${Number(o.totalAmount).toFixed(2).replace(".", ",")}`;
      const statusLabel = formatStatus(o.status);

      return [
        o.orderNumber,
        orderDate,
        customerName,
        customerContact || "—",
        itemsLabel,
        payment,
        totalFormatted,
        statusLabel,
      ];
    });

    autoTable(doc, {
      startY: 56,
      head: [["Nº Pedido", "Data / Hora", "Cliente", "Contato / Cidade", "Itens", "Pagamento", "Total", "Status"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 30 },
        2: { cellWidth: 46 },
        3: { cellWidth: 50 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 30 },
        6: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        7: { cellWidth: 26, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 7) {
          const rawText = String(data.cell.raw);
          if (rawText === "Pago" || rawText === "Entregue") {
            data.cell.styles.textColor = [16, 149, 106];
          } else if (rawText === "Pendente" || rawText === "Enviado") {
            data.cell.styles.textColor = [217, 119, 6];
          } else if (rawText === "Cancelado") {
            data.cell.styles.textColor = [225, 29, 72];
          }
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Add Pagination Footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 201, pageWidth - 14, 201);
      doc.text("Aurora Store • Relatório Oficial de Vendas • Uso Interno Confidencial", 14, 205);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 32, 205);
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vendas_aurora_${dateStr}.pdf"`,
      },
    });
  }

  // 2. Export in Spreadsheet (.CSV) Format (Default)
  const header =
    "Numero_Pedido;Data_Hora;Cliente;Telefone;Email;Status;Metodo_Pagamento;Tipo_Frete;Endereco_Entrega;Cidade;Estado;CEP;Qtd_Itens;Desconto_R$;Total_R$;Observacoes\n";

  const rows = orders.map((o) => {
    const date = new Date(o.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const total = Number(o.totalAmount).toFixed(2).replace(".", ",");
    const discount = Number(o.discountAmount || 0).toFixed(2).replace(".", ",");
    const totalItems = o.items.reduce((acc, i) => acc + i.quantity, 0);
    const notes = (o.notes || "").replace(/"/g, '""');
    const address = (o.shippingAddress || "").replace(/"/g, '""');
    const customerName = (o.customer?.name || "Cliente").replace(/"/g, '""');
    const customerPhone = (o.customer?.phone || "").replace(/"/g, '""');
    const customerEmail = (o.customer?.email || "").replace(/"/g, '""');
    const city = (o.shippingCity || o.customer?.city || "").replace(/"/g, '""');
    const state = (o.shippingState || o.customer?.state || "").replace(/"/g, '""');
    const cep = (o.shippingCep || o.customer?.cep || "").replace(/"/g, '""');

    return `"${o.orderNumber}";"${date}";"${customerName}";"${customerPhone}";"${customerEmail}";"${formatStatus(
      o.status
    )}";"${formatPaymentMethod(o.paymentMethod)}";"${formatShippingType(
      o.shippingType
    )}";"${address}";"${city}";"${state}";"${cep}";${totalItems};"${discount}";"${total}";"${notes}"`;
  });

  // UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = "\uFEFF" + header + rows.join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas_aurora_${dateStr}.csv"`,
    },
  });
}
