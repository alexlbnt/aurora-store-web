# Aurora Store Web 🌙

Plataforma de E-commerce premium focada em sleepwear, oferecendo uma experiência elegante e fluida. O sistema conta com uma vitrine virtual sofisticada e um painel administrativo completo para gerenciamento de produtos, vendas e clientes.

## 🚀 Tecnologias Utilizadas

O projeto foi construído utilizando as ferramentas mais modernas do ecossistema React:

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados:** PostgreSQL (hospedado na [Neon](https://neon.tech/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticação:** [NextAuth.js](https://next-auth.js.org/)
- **Gráficos (Admin):** [Recharts](https://recharts.org/)

## 🛍️ Funcionalidades

### Área do Cliente (Storefront)
- Catálogo de produtos com categorias (Camisolas, Conjuntos, Roupões, etc).
- Página de detalhes do produto (com suporte a variações de cores e tamanhos).
- Carrinho de compras integrado.
- Lista de Desejos (Wishlist).
- Layout responsivo, focado no minimalismo.

### Painel Administrativo
- **Dashboard:** Visão geral com gráficos de vendas e métricas.
- **Produtos:** Cadastro, edição e listagem (com suporte a upload via URLs externas).
- **Vendas:** Gerenciamento do status de pedidos.
- **Clientes:** Cadastro e visualização de clientes.

---

## 🛠️ Como rodar o projeto localmente

### Pré-requisitos
- Node.js versão 18+
- NPM ou Yarn

### Passo a passo

1. **Clone o repositório:**
```bash
git clone https://github.com/alexlbnt/aurora-store-web.git
cd aurora-store-web
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto contendo as credenciais. (Veja o arquivo `.env.example` se existir, ou configure as seguintes chaves):
```env
DATABASE_URL="Sua URL do Postgres"
AUTH_SECRET="Sua_chave_secreta_gerada_aleatoriamente"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Prepare o Banco de Dados:**
```bash
npx prisma generate
npx prisma db push
```
*(Opcional: Para preencher o banco com dados iniciais de teste, rode `npx prisma db seed`)*

5. **Inicie o Servidor Local:**
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a loja.
O painel administrativo fica disponível na rota `/admin`.

---

## ☁️ Deploy (Vercel)

Este projeto está pronto para ir ao ar. A recomendação principal é publicá-lo através da **Vercel**:

1. Crie um projeto na [Vercel](https://vercel.com).
2. Importe este repositório do seu GitHub.
3. Adicione as variáveis de ambiente em **Settings > Environment Variables**:
   - `DATABASE_URL`
   - `AUTH_SECRET`
4. Inicie o Deploy! O comando `prisma generate` já está configurado no `postinstall` do `package.json`, então o banco conectará automaticamente.

---
*© 2024 Aurora Sleepwear. Feito para sonhar.*

Link do site: (https://aurora-store-web.vercel.app)
