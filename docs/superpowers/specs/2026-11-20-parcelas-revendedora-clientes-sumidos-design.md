# Venda parcelada, revendedora e clientes sumidos — design

Data: 2026-11-20 · Versões previstas: v1.9.x

Três entregas independentes no painel da Aurora, nesta ordem:

1. **Clientes sumidos** (`/admin/customers`) — sem mudança no banco
2. **Revendedora no pedido** (`/admin/sales/new` e edição) — 1 coluna nova
3. **Venda parcelada** (`/admin/sales/new`, edição e tela do pedido) — 1 tabela nova

Cada uma vira uma versão própria, testada e publicada separadamente.

---

## 1. Clientes sumidos

### Por quê
As vendedoras precisam saber quais clientes pararam de comprar, e há quanto tempo, para retomar o contato e cuidar do relacionamento. O card atual "Gasto médio por cliente" repete o "Ticket médio" do painel e sai para dar lugar a este.

### O que muda
- **Card "Sem comprar há +60 dias"** no lugar de "Gasto médio por cliente": mostra o número de clientes nessa situação, contados em todo o cadastro (não muda com a busca). Clicar no card filtra a lista abaixo para mostrar só esses clientes, quem está sumido há mais tempo primeiro. Um link "ver todos" tira o filtro.
- **Na lista de clientes** (celular e computador), a última compra aparece como "há N dias", com a data junto. Quando passa de 60 dias, fica destacada com a cor de alerta do painel.
- **Regras:**
  - Considera só pedidos **não cancelados**.
  - Quem **nunca comprou** não entra; esses clientes já aparecem separados no card "Já compraram".
  - O limite é **60 dias**, numa constante única (`INACTIVE_CUSTOMER_DAYS`, em `src/lib/`).
  - Os dias são contados pela data em Brasília.

### Como fazer
- O filtro entra na URL (`?sumidos=1`) e pode ser combinado com a busca (`q`) e com a paginação que já existem.
- Contagem e lista filtrada saem de um `groupBy` em `Order` por `customerId`:
  - `where`: status diferente de CANCELED;
  - `_max.createdAt` anterior ao corte (`having`);
  - ordenado por `_max.createdAt` em ordem crescente;
  - paginado pelos ids, e depois `findMany` dos clientes desses ids, mantendo a ordem.
  - A busca `q` entra como `where` em `customer` dentro do `groupBy` (filtro pela relação) ou por um passo intermediário. Fica a critério do builder, desde que busca e filtro funcionem juntos.
- Funções puras e testadas: `daysSince(date, now)` e `isInactive(lastPurchase, now)`.

### Fora do escopo
- Aviso automático, mensagem para a cliente ou lista de "quem contatar".
- Registro de contatos feitos.

---

## 2. Revendedora no pedido

### Por quê
Às vezes quem faz a venda para a Aurora é uma revendedora. A vendedora da Aurora lança o pedido e precisa registrar quem foi a revendedora. **A informação é só uma anotação no pedido:** não entra em comissão, relatório nem pagamento à revendedora.

### O que muda
- **Banco:** `Order.resellerName String?`, coluna nova que aceita vazio. Não precisa preencher nada nos pedidos antigos.
- **Formulário de venda** (nova e edição): campo opcional **"Revendedora"**, na seção do cliente ou logo depois dela, a critério do builder. Vazio quer dizer venda direta da Aurora.
  - O campo sugere os nomes já usados (`<datalist>` com os nomes distintos de `Order.resellerName`, carregados em `loadOrderFormData`), para não surgir "Ana", "ana" e "Ana " como pessoas diferentes.
  - Texto com espaços tirados nas pontas, até 80 caracteres; vazio é gravado como `null`.
  - Entra no rascunho salvo no navegador, como os outros campos.
- **Tela do pedido:** mostra "Revendedora: Nome" quando houver.
- **Lista de vendas:** mostra o nome da revendedora junto do cliente, quando houver.
- **Planilha de vendas (CSV):** ganha a coluna "Revendedora". *(Escolha minha, porque custa quase nada.)*

### Fora do escopo
- Cadastro de revendedoras, comissão e relatório por revendedora.

---

## 3. Venda parcelada

### Por quê
Qualquer forma de pagamento pode ser parcelada. As vendedoras registram no painel a quantidade de parcelas, a data de vencimento de cada uma e as baixas (recebimentos). Elas precisam ver, **na tela do pedido**, quais parcelas estão pagas, em aberto ou atrasadas.

### Abordagens consideradas
- **A. Tabela de parcelas, com a situação calculada a partir das baixas — ESCOLHIDA.** As parcelas guardam só número, vencimento e valor. As baixas (`OrderPayment`) continuam como são. O total recebido vai quitando as parcelas da mais antiga para a mais nova (pelo número da parcela). Estornar uma baixa corrige as parcelas sozinho, e o Financeiro não muda.
- B. Cada baixa amarrada a uma parcela: o mesmo dado fica em dois lugares, estorno e edição podem desencontrar parcela e baixa, e toda baixa ganha um passo a mais.
- C. Parcelas como JSON dentro do pedido: não dá para procurar por vencimento. A lista de atrasadas, deixada para o futuro, exigiria refazer tudo.

### Banco
```prisma
model OrderInstallment {
  id       String   @id @default(uuid())
  orderId  String
  number   Int                       // 1, 2, 3...
  dueDate  DateTime @db.Date         // só a data
  amount   Decimal  @db.Decimal(10, 2)
  order    Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@unique([orderId, number])
  @@index([dueDate])
}
```
`Order` ganha `installments OrderInstallment[]`. O pedido é parcelado quando tem parcelas; não há coluna extra para isso.

### Formulário de venda (nova e edição)
- Na seção de pagamento, depois da forma de pagamento: **"Parcelado?" Não / Sim**. O padrão é "Não", e com "Não" tudo funciona como hoje.
- **Com "Sim":**
  - **Quantidade de parcelas:** de 2 a 24.
  - **1º vencimento:** o padrão é daqui a 30 dias.
  - O sistema gera as parcelas: valores iguais sobre o **total já com desconto**, com os centavos que sobram na 1ª, e as datas seguintes mês a mês. Quando o mês não tem o dia (31/01 → fev), usa o último dia do mês.
  - A vendedora pode **editar o valor e a data de cada parcela**. A soma tem que fechar com o total: o formulário mostra a diferença e não deixa salvar enquanto ela não for zero.
  - Se o total mudar depois (produtos ou desconto), as parcelas são **recalculadas em partes iguais**, mantendo as datas. *(Escolha minha: é mais simples e previsível do que tentar preservar valores editados.)*
- **"Já foi pago" × parcelado:** com "Sim" marcado, a opção "já foi pago" vira **"A 1ª parcela já foi paga (entrada)"**. Marcada, cria uma baixa com o valor da 1ª parcela, na forma de pagamento escolhida e com a data de hoje. A venda continua Pendente até quitar tudo.
- **Resumo lateral e tela de sucesso:** mostram "3x de R$ 100,00" quando houver parcelas, junto da forma de pagamento. A mensagem de WhatsApp de sucesso inclui o parcelamento se já citar a forma de pagamento; o builder confere em `OrderSuccess.tsx`.
- O rascunho salvo no navegador passa a guardar parcelado, quantidade e lista de parcelas.

### Servidor (`createOrder` / `updateOrder`)
- Recebe `installments` como JSON (`[{ number, dueDate: "AAAA-MM-DD", amount }]`) e valida com uma função pura testada:
  - de 2 a 24 parcelas;
  - números em sequência 1..n;
  - datas válidas;
  - valores maiores que zero;
  - **soma igual ao `totalAmount` calculado no servidor**, com tolerância de R$ 0,01 por arredondamento.
  - Não exige datas em ordem crescente, para não travar renegociação; o builder pode avisar no formulário.
- Erro de validação devolve mensagem clara, como as outras do formulário.
- `createOrder`: cria as parcelas na mesma transação do pedido. A entrada, se houver, vira uma `OrderPayment` com o valor da 1ª parcela.
- `updateOrder`: **apaga e recria** as parcelas do pedido na transação. Desmarcar "Parcelado" apaga as parcelas. As baixas não são tocadas, e a regra que já existe ("novo total menor que o já recebido") continua valendo.
- O status do pedido continua seguindo `statusAfterPayments`, sem mudança.

### Tela do pedido (`/admin/sales/[id]`)
- Quando houver parcelas, aparece a lista **"Parcelas (3x de R$ 100,00)"** dentro ou logo acima do card de recebimentos. Cada linha mostra: número/total, vencimento, valor e situação.
  - **Paga:** coberta inteira pelas baixas.
  - **Parcial:** "faltam R$ X".
  - **Atrasada:** vencimento antes de hoje (Brasília) e não quitada, com destaque em cor de alerta.
  - **Em aberto:** as demais.
- A situação vem de uma **função pura testada**, `allocateInstallments(installments, totalPaid, today)`: distribui o total recebido em ordem de número e devolve, por parcela, o quanto foi pago e a situação.
- **Pedido cancelado:** as parcelas aparecem sem "Atrasada", em tom neutro.
- O botão de registrar baixa continua o mesmo. Com parcelas, o valor sugerido é o que falta da **parcela em aberto mais antiga** (hoje o padrão é o restante total). *(Escolha minha.)*

### Fora do escopo
- Lista ou aviso de parcelas atrasadas fora da tela do pedido (pode vir depois; o índice em `dueDate` já fica pronto para isso).
- Juros, multa e taxa de maquininha.
- Mudança no Financeiro: ele continua contando pelas baixas.

---

## Testes
- **Unitários (Vitest):**
  - divisão em parcelas iguais, com os centavos na 1ª;
  - datas mês a mês, inclusive o fim de mês;
  - validação das parcelas;
  - `allocateInstallments`: pagas, parcial, atrasada, cancelado e estorno;
  - `daysSince` e `isInactive`.
- **Ponta a ponta (Playwright, banco de dev):**
  - venda parcelada em 3x com entrada → a tela do pedido mostra 1ª paga e 2 em aberto → registrar uma baixa → 2ª paga;
  - venda com revendedora → nome aparece no pedido e na lista;
  - filtro "sumidos" mostra um cliente com última compra há mais de 60 dias.
- Verificação completa antes de cada publicação: tipos, lint, testes unitários, build e ponta a ponta.

## Publicação
- As entregas 2 e 3 mudam o banco **só acrescentando** (coluna que aceita vazio e tabela nova).
- Para cada uma: `prisma db push` no banco de dev; depois, com o endereço do banco de **produção** fornecido pelo Alexandre (console da Neon), `prisma migrate diff` para confirmar que só acrescenta, `db push` em produção e só então o deploy.
- A entrega 1 não mexe no banco.

## Decisões tomadas pelo builder (escolhas minhas, para revisar)
- Coluna "Revendedora" na planilha CSV de vendas.
- Parcelas recalculadas em partes iguais quando o total muda.
- Valor sugerido da baixa é o que falta da parcela mais antiga em aberto.
- De 2 a 24 parcelas; 1º vencimento padrão em 30 dias; fim de mês ajustado ao último dia.
- Clientes sumidos contam em todo o cadastro, não só no resultado da busca.
