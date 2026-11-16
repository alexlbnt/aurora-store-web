// Uso único (v1.8.4): produtos criados antes da v1.8.3 têm endereço com código aleatório no fim
// (ex.: sleep-dress-curto-isis-omxeb). Este script troca pelo endereço limpo (sleep-dress-curto-isis).
// Os links antigos pelo id do produto continuam funcionando (redirecionam para o novo).
// Idempotente: produto que já está com o endereço limpo não muda.
//   npx tsx scripts/clean-product-slugs.ts          -> mostra o que faria
//   npx tsx scripts/clean-product-slugs.ts --apply  -> grava
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  // Endereços em uso, atualizados à medida que o script decide os novos.
  const taken = new Set(products.map((p) => p.slug));
  const changes: { id: string; name: string; from: string; to: string }[] = [];

  for (const p of products) {
    // Só mexe no formato antigo: nome sem acento (como o painel gerava) + "-" + código aleatório.
    // Endereços escritos à mão ou de produtos renomeados ficam como estão.
    const oldBase = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const suffix = p.slug.startsWith(`${oldBase}-`) ? p.slug.slice(oldBase.length + 1) : null;
    if (!suffix || !/^[a-z0-9]{3,8}$/.test(suffix) || !/[a-z]/.test(suffix)) continue;

    const base = slugify(p.name) || "produto";
    if (p.slug === base) continue;

    taken.delete(p.slug);
    let candidate = base;
    for (let n = 2; taken.has(candidate); n++) candidate = `${base}-${n}`;
    taken.add(candidate);
    changes.push({ id: p.id, name: p.name.trim(), from: p.slug, to: candidate });
  }

  console.log(`${products.length} produto(s); ${changes.length} endereço(s) a limpar.`);
  for (const c of changes) console.log(`  ${c.name}: ${c.from}  ->  ${c.to}`);

  if (!apply) {
    console.log("\nNada foi gravado. Rode com --apply para gravar.");
    return;
  }

  // Tudo ou nada: se um falhar, nenhum endereço muda.
  await prisma.$transaction(
    changes.map((c) => prisma.product.update({ where: { id: c.id }, data: { slug: c.to } }))
  );
  console.log(`\n${changes.length} endereço(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
