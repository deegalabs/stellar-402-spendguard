# SpendGuard — Script de Apresentação (Vídeo)

**Duração alvo:** ~3:00
**Tom:** humano, conversacional, claro para qualquer pessoa — técnico o suficiente para juízes, acessível o suficiente para quem nunca ouviu falar de Stellar.
**Idioma:** Português (narração) com tela em inglês.

---

## [0:00 – 0:25] 🪝 O gancho

> "Imagina que você deu um cartão de crédito da sua empresa para um estagiário novo.
>
> Você confia nele. Mas você não dá um cartão sem limite, né? Você coloca um teto diário. Você limita cada compra. Você escolhe onde ele pode usar.
>
> Agora troca o estagiário por um **agente de IA**. Um robô que toma decisões sozinho, compra APIs sozinho, paga por dados sozinho — **vinte e quatro horas por dia**.
>
> Hoje, se alguém conseguir enganar esse agente com um prompt malicioso, ele pode torrar o orçamento inteiro em minutos. E a única coisa que impede isso é... **esperança**."

**Visual:** tela preta, texto grande aparecendo: *"Your AI agent has a credit card. Who's watching it?"*

---

## [0:25 – 0:45] 💡 A ideia simples

> "O SpendGuard resolve isso com uma ideia simples: **as regras de gasto moram no chip do cartão, não no banco**.
>
> A gente escreveu um contrato inteligente na Stellar que fica entre o agente e o dinheiro. Você define o limite diário, o máximo por transação, a lista de lugares onde ele pode pagar — e um botão de pânico.
>
> E aí não importa se alguém invadir o servidor, enganar o agente ou trocar a chave. As regras estão **gravadas na blockchain**. Quem manda é o contrato, não o servidor."

**Visual:** logo do SpendGuard surge, com três ícones orbitando: 🛡️ limite diário · 💳 cap por tx · 🚨 kill switch.

---

## [0:45 – 2:25] 🎭 A demo como prova

> "Deixa eu te mostrar funcionando de verdade. Tudo que você vai ver agora está rodando na **testnet da Stellar**, ao vivo, com um contrato real que você pode auditar na blockchain."

### Capítulo 1 — O contrato (0:50)

**Ação na tela:** abre `/demo`, clica em *Run Chapter 1*.

> "Aqui é o contrato. Limite diário de cem dólares. Máximo de cinco dólares por transação. Está ativo e vazio — pronto para o agente começar a trabalhar."

**Visual:** painel mostrando *Daily Limit $100 · Max/Tx $5 · Status: ACTIVE*.

### Capítulo 2 — Um pagamento feliz (1:10)

> "O agente faz uma requisição HTTP normal. O servidor responde com o código quatro zero dois — 'pague primeiro'. O SpendGuard consulta o contrato, vê que tem orçamento, vê que o valor está dentro do cap, vê que o destino é confiável — e libera o pagamento. Três dólares, aprovado, gravado na Stellar."

**Visual:** log aparecendo linha por linha, termina com um *TX hash* clicável.

### Capítulo 3 — O limite por transação (1:30)

> "Agora o agente tenta pagar dez dólares. O cap é cinco. O contrato recusa **antes** do dinheiro sair. Não é o servidor dizendo não — é a **matemática da blockchain** dizendo não."

**Visual:** banner vermelho *"REJECTED — exceeds per-tx cap"*, com hash do evento on-chain.

### Capítulo 4 — O teto diário (1:45)

> "O agente volta a fazer pagamentos pequenos. Vai somando, vai somando... até que bate nos cem dólares do dia. A próxima transação, por menor que seja, é bloqueada. O contrato sabe quanto já foi gasto hoje — porque ele mesmo contou."

**Visual:** barra de progresso enchendo até 100%, última tentativa cai em vermelho.

### Capítulo 5 — O botão de pânico (2:00)

> "E se alguma coisa der errado? Se o agente começar a agir estranho? Um clique. **Pause**. O contrato inteiro congela. Qualquer pagamento novo, aprovado ou não, é rejeitado na hora. É o kill switch — e ele também mora na blockchain."

**Visual:** botão *Pause* é clicado, indicador muda de verde para vermelho, próxima tentativa do agente mostra *"CONTRACT PAUSED"*.

### Capítulo 6 — A trilha de auditoria (2:15)

> "E tudo que aconteceu — cada pagamento aprovado, cada recusa, cada mudança de regra — fica gravado na Stellar pra sempre. Não é um log que a gente guarda num servidor que pode ser apagado. É **história imutável**. Você pode abrir o explorer agora e conferir cada transação que eu acabei de te mostrar."

**Visual:** aba do Stellar Expert abrindo, mostrando a lista de eventos reais.

---

## [2:30 – 2:50] 🎯 Por que isso importa

> "Agentes de IA vão movimentar dinheiro. Isso já está acontecendo. A pergunta não é *se* — é *quem controla*.
>
> O SpendGuard dá pra qualquer desenvolvedor colocar o agente dele numa coleira programável, em minutos, sem precisar confiar em servidor nenhum. É governança de gasto construída na infraestrutura mais barata e rápida da Stellar — e compatível com o padrão x402 que os grandes players já estão adotando."

**Visual:** diagrama simples *Agente → x402 → SpendGuard → Stellar*.

---

## [2:50 – 3:15] 🏁 Fechamento

> "A gente entrega o SpendGuard como uma infraestrutura **open-source** porque acredita que segurança não deve ser um obstáculo para a inovação.
>
> Se o medo do risco financeiro era o que impedia a escala institucional na Stellar, talvez essa camada de proteção em Soroban seja o próximo passo lógico para finalmente trazer as empresas pra dentro da rede.
>
> A gente resolveu o *'pode pagar?'* — pra que os desenvolvedores não precisem mais se preocupar com o esgotamento das próprias carteiras.
>
> O código está pronto. O futuro dessa autonomia agora depende de quão longe a gente quer levar essa nova economia.
>
> **Muito obrigado.**"

**Visual:** logo final + URLs (github.com/.../spendguard · stellar-402-spendguard.vercel.app).

---

## 🎙️ Como entregar essa narração de forma humana

### Ritmo e pausas
- Pausa de **um segundo inteiro** depois de "esperança" (0:25). Deixa o vazio assustar.
- Pausa de meio segundo antes de cada capítulo da demo. Dá tempo do olho do juiz acompanhar o visual.
- Não tenha pressa nos termos técnicos (Soroban, x402, kill switch). Falar devagar aí é o que diferencia "entendi" de "perdi".

### Tom de conversa
- Fale como se estivesse explicando pra um amigo inteligente, não pra uma banca.
- Use "a gente" em vez de "nós". Use "você" direto pro espectador.
- Rir levemente nas partes do estagiário e do botão de pânico — humor desarma juízes.

### Ênfase nas três palavras-chave
Essas três frases são o esqueleto emocional do pitch. Se o espectador só lembrar delas, já ganhou:

1. **"Esperança"** — fim do gancho. Tem que soar como um problema real, não retórica.
2. **"No chip, não no banco"** — analogia do cartão. Devagar, com ênfase no contraste.
3. **"Pelo contrato, não pelo servidor"** — fim do Capítulo 3. A frase que vende a tese inteira.

### Energia
- Primeiros 25 segundos: **sério, quase preocupado**. Você está descrevendo um risco.
- Do 0:25 ao 2:25: **confiante e empolgado**. Você está mostrando a solução funcionando.
- Últimos 10 segundos: **calmo e direto**. Você está fechando uma proposta, não vendendo um produto.
