# Produzido automático no cadastro e carga inicial — design

Data: 2026-11-21 · Versão prevista: v1.9.4

## Por quê
A coluna "Produzido / Vendido" em `/admin/products` acabou de ser criada e está zerada em todos os produtos. O Alexandre quer duas coisas:

1. **Produto novo:** o estoque informado no cadastro (A e V) já conta como produzido.
2. **Produtos existentes:** preencher o produzido de uma vez, para a coluna deixar de mostrar zero.

## Como funciona hoje
"Produzido" não é um campo do produto. É a soma dos **lançamentos de produção** (`ProductionEntry`: variação, quantidade, estoque A/V, data, observação), que hoje só são criados pelo "Lançar produção". Esse caminho **soma no estoque**. Os lançamentos também aparecem:
- no histórico de produção do produto;
- no Financeiro, no quadro "Produzido x vendido no mês" do mês da data do lançamento.

## Decisões
- **Cadastro de produto novo** (`createProduct`): na mesma transação, cria um lançamento por variação e por estoque com quantidade maior que zero.
  - Observação: "Estoque inicial do cadastro". Data: agora.
  - **Não** soma no estoque de novo, porque as peças já entraram pelo cadastro.
- **Carga inicial** (uma vez, por script): um lançamento por variação e por estoque com quantidade = **estoque atual + vendido daquele estoque**.
  - "Vendido daquele estoque": itens de pedidos **não cancelados** daquela variação, com `Order.stockLocation` igual ao estoque.
  - Observação: "Carga inicial (estoque + vendido)". Data: a data de cadastro do produto (`Product.createdAt`), para não inflar novembro no Financeiro.
  - Não mexe no estoque.
- **Itens vendidos sem variação** (pedidos antigos): contam na variação do produto quando ele tem **uma só** variação. Se o produto tiver várias, ficam de fora e o script lista quais foram.
- **O script pode rodar mais de uma vez sem duplicar:** pula produto que já tenha qualquer lançamento de produção e informa quais pulou.
- **Rodar primeiro em modo de simulação**, que só mostra os números por produto. Depois roda para valer, primeiro no banco de dev e depois no de produção.
- **Fora do escopo:**
  - editar o estoque na edição do produto, ou no "Ajustar estoque", continua sem contar como produção;
  - a edição de produto não cria lançamentos.

## Abordagens consideradas
- **Script único em `scripts/` com tsx (escolhida):** pode ser simulado antes e rodado no dev e na produção. Não deixa botão perigoso no painel.
- **Botão no painel:** cômodo, mas fica disponível para sempre, com risco de rodar duas vezes por engano.
- **SQL direto no Neon:** sem teste e difícil de revisar a regra do "vendido por estoque".

## Publicação
- Não há mudança de schema.
- A carga em produção usa o endereço do banco. Antes, trocar a senha que apareceu no chat; usar o endereço novo só no comando, sem gravar em arquivo.
- Fazer uma cópia de segurança antes (branch filho no Neon).
- Ordem: deploy do código (cadastro novo) → simulação em produção → carga em produção.

## Testes
- **Unitários** da conta da carga: estoque + vendido por estoque, cancelados fora, item sem variação com 1 ou várias variações, zero não gera lançamento.
- **Ponta a ponta:** cadastrar um produto com estoque A/V → a lista mostra "Produzido" igual à soma, e o estoque não dobra.
