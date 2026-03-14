import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding the database...')

  // Limpar tabelas existentes para evitar duplicatas ao rodar multiplas vezes
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  
  // 0. Criar Usuário Admin Default
  const hashedPassword = await bcrypt.hash('aurora2024', 10);
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@aurora.com.br',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // 1. Criar Categorias
  const catConjuntos = await prisma.category.create({
    data: { name: 'Conjuntos', slug: 'conjuntos', description: 'Conjuntos práticos e confortáveis' }
  })
  const catCamisolas = await prisma.category.create({
    data: { name: 'Camisolas', slug: 'camisolas', description: 'Camisolas fluidas e elegantes' }
  })
  const catRoupoes = await prisma.category.create({
    data: { name: 'Roupões', slug: 'roupoes', description: 'Roupões macios para dias frios' }
  })
  const catAcessorios = await prisma.category.create({
    data: { name: 'Acessórios', slug: 'acessorios', description: 'Necessaires e presilhas' }
  })

  // 2. Criar Produtos com Variações e Imagens
  // Produto 1: Seda Pura Noturno (Featured/Trending)
  const p1 = await prisma.product.create({
    data: {
      name: 'Conjunto Seda Pura Noturno',
      slug: 'conjunto-seda-pura-noturno',
      description: 'Com modelagem fluida e toque incomparavelmente macio, este conjunto foi desenhado para abraçar seu corpo.',
      basePrice: 489.00,
      sku: 'CJ-SEDA-001',
      categoryId: catConjuntos.id,
      isFeatured: true, // Trending / Em Alta
      images: {
        create: [
          { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBItmN9eB11w_Z6UoMv_D24Z4f-GjO55Q322H00bM5F_2Q6P5zG6I52hP8Zk9dG4B1g3J5U7c_f8U4k180u1K46R-tZ2eY56f9s6b5C8Xz85g1B7Hh8X9C_T5t8y_q7O5N34m4M_F1Z-0j-lZ0p_M-QvE93D_E_Z_A_H_A_z_oV', isDisplay: true, order: 1 },
          { url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop', order: 2 }
        ]
      },
      variants: {
        create: [
          { color: 'Pérola', size: 'M', stock: 10, sku: 'CJ-SEDA-001-P-M' },
          { color: 'Preto', size: 'M', stock: 5, sku: 'CJ-SEDA-001-PR-M' },
        ]
      }
    }
  })

  // Produto 2: Roupão Aveludado
  const p2 = await prisma.product.create({
    data: {
      name: 'Roupão Aveludado Premium',
      slug: 'roupao-aveludado-premium',
      description: 'Roupão premium felpudo e envolvente.',
      basePrice: 529.00,
      sku: 'RP-AVEL-001',
      categoryId: catRoupoes.id,
      isFeatured: true, 
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1588665796035-1a3b90f55e5b?q=80&w=1587&auto=format&fit=crop', isDisplay: true, order: 1 }
        ]
      },
      variants: {
        create: [
          { color: 'Argila', size: 'Único', stock: 20, sku: 'RP-AVEL-001-U' }
        ]
      }
    }
  })

  // Produto 3: Camisola Botões
  const p3 = await prisma.product.create({
    data: {
      name: 'Camisola com Botões Algodão',
      slug: 'camisola-botoes-algodao',
      description: 'Praticidade e conforto em algodão respirável.',
      basePrice: 249.90,
      sku: 'CM-ALG-001',
      categoryId: catCamisolas.id,
      isFeatured: false, // Clássico / Essential
      images: {
        create: [
          { url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQqA8Q8lZ0t9R5x_9M8t9b7Zz9x_x9c7z5z_z5O9G5j7j5j5j5z_x9O7b8Z8x8Z8D9Q5M_J2L6N1B6N0B5V6J8H9M4E4b0G1g6I2s5b7O3z6G3H1g4M9Z8Z8D9Q5', isDisplay: true, order: 1 }
        ]
      },
      variants: {
        create: [
          { color: 'Azul Bebê', size: 'P', stock: 15, sku: 'CM-ALG-001-AZ-P' }
        ]
      }
    }
  })

  // Produto 4: Pijama Curto Linho
  await prisma.product.create({
    data: {
      name: 'Pijama Curto Linho Leve',
      slug: 'pijama-curto-linho',
      description: 'Pijama de linho fresco para o verão.',
      basePrice: 389.00,
      sku: 'PJ-LIN-001',
      categoryId: catConjuntos.id,
      isFeatured: false,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1623122606563-7ebcc0ad8a7d?q=80&w=1587&auto=format&fit=crop', isDisplay: true, order: 1 }
        ]
      },
      variants: {
        create: [
          { color: 'Areia', size: 'G', stock: 8, sku: 'PJ-LIN-001-AR-G' }
        ]
      }
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
