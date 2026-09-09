# 💳 onWallet

**onWallet** é um sistema de gestão financeira pessoal (MVP) focado em simplicidade e visão estratégica. Ele permite que os usuários acompanhem para onde o seu dinheiro está indo, gerenciem "Caixinhas" (Contas) e definam orçamentos mensais para não estourar o limite de gastos.

---

## 🎯 Objetivo do Projeto
Oferecer uma alternativa minimalista e visual aos apps complexos de finanças. No onWallet, você sabe exatamente o seu Saldo Geral, o que gastou, o que recebeu, e acompanha visualmente suas despesas agrupadas por Categoria através de gráficos interativos.

---

## 🛠️ Tecnologias Utilizadas (Stack)

O projeto é dividido em um monorepo contendo o Frontend e o Backend separados.

### Frontend
- **React (com Vite)** para interface de usuário rápida e reativa.
- **TypeScript** para tipagem forte e evitar bugs em tempo de compilação.
- **Tailwind CSS** para estilização utilitária e componentes bonitos.
- **Recharts** para geração de Gráficos de Rosca dinâmicos.
- **Axios** para chamadas de API.
- **SweetAlert2 & React-Toastify** para feedbacks visuais e modais de confirmação.

### Backend
- **Node.js + Express** para roteamento de APIs RESTful.
- **TypeScript** mantendo a consistência com o frontend.
- **Prisma ORM** para comunicação elegante com o banco de dados.
- **SQLite** como banco de dados relacional leve e sem dor de cabeça

## 🌟 Versão 2.0 (Novas Features)
O projeto evoluiu do conceito tradicional de bancos para uma gestão focada em objetivos:
- **Caixinhas (Envelopes):** As contas se tornaram "Caixinhas" com "Tags" livres (ex: Reserva, Viagem, Férias).
- **Transferências:** Novo sistema para transferir dinheiro entre Caixinhas, usando um cálculo robusto de "Mapa de Deltas" no Prisma para manter a consistência contábil ao editar ou excluir transferências.

## 🌟 Funcionalidades do MVP (Versão 1.0)

---

## 🚀 Como Rodar o Projeto

1. Clone o repositório.
2. Instale as dependências:
   - No frontend: `cd frontend && npm install`
   - No backend: `cd backend && npm install`
3. Configure o banco de dados (Prisma):
   - No backend rode: `npx prisma migrate dev` ou `npx prisma db push`
4. Inicie os servidores:
   - Frontend: `npm run dev`
   - Backend: `npm run dev`
5. Acesse `http://localhost:5173` ou a porta configurada no seu navegador.

---

## ✅ O que foi entregue no MVP (Versão 1.0)

O MVP foi focado em entregar os "Cadastros Básicos" e o "Core Value" da visualização financeira:

- **Dashboard Estratégico:** Resumo financeiro mensal e Gráfico de Rosca interativo mostrando gastos por Categoria.
- **Gestão de Contas:** Cadastro de carteiras, poupanças e contas bancárias, somando o saldo geral do usuário.
- **Gestão de Categorias:** Criação de categorias (Receitas/Despesas) com seleção de Cor e Icon Picker (Emojis).
- **Gestão de Transações:** Registro ágil de entradas e saídas de dinheiro.
- **Orçamentos Mensais:** Definição de limites de gastos por categoria. O sistema gera uma barra de progresso para te avisar se o limite foi atingido.
- **UX Refinada:** Navegação suave, modais polidos e alertas de sucesso/erro sem interromper o usuário.

---

## 🗺️ Roadmap e Backlog (Versão 2.0)

O MVP já está rodando perfeitamente. Estas são as ideias priorizadas para a próxima iteração:

- [ ] **Transferências entre Caixinhas (Accounts):** Adicionar o tipo `TRANSFER` na base de dados e permitir mover saldo de uma Caixinha/Conta para outra sem que isso seja contabilizado falsamente como Receita ou Despesa no Dashboard.
- [ ] **Renomear Conceito de "Contas" para "Caixinhas/Metas":** Adaptar o layout e a linguagem visual para a metodologia de "Envelopes" (Investimentos, Viagem, Reserva de Emergência).
- [ ] **Refatoração dos Tipos de Caixinha:** Repensar a estrutura atual de tipos fixos (Corrente, Poupança, Cartão) permitindo que o usuário altere livremente ou crie tipos/tags personalizadas.
- [ ] **Compras Parceladas e Cartão de Crédito:** Implementar lógica para despesas parceladas (ex: Geladeira em 12x), inserindo as transações futuras automaticamente. Em paralelo, criar o módulo de faturas de cartão.
- [ ] **Criação de Orçamento Ágil:** Na tela de criação de uma nova Categoria, adicionar um atalho perguntando se o usuário já deseja definir um Orçamento de gastos para ela de forma imediata.
- [ ] **Responsividade (Mobile First):** Garantir que grids, tabelas e menus funcionem perfeitamente em telas de celulares para uso no dia a dia.
- [ ] **Filtros Avançados:** Busca por texto, ordenação de tabelas e filtragem cruzada na aba de Transações.

