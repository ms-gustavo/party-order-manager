# Comanda

App pra dividir a conta do bar. Coloca a galera na mesa, anota os pedidos dizendo quem consumiu cada um, escolhe a taxa de serviço e pronto: o app mostra quanto cada pessoa paga e monta o texto pra mandar no grupo do WhatsApp.

Funciona offline e pode ser instalado na tela inicial do celular (PWA). Os dados ficam só no navegador, no `localStorage`.

## Funcionalidades

- **Pessoas na mesa**: adicione várias em sequência, remova quando alguém for embora.
- **Pedidos com quem consumiu**: por padrão o item é de todos que estão na mesa naquele momento (quem chega depois não entra na divisão do que foi pedido antes); toque no chip do item pra escolher pessoas específicas.
- **Pagou e foi embora**: toque na pessoa e feche a conta dela. O valor fica congelado (nem a mudança de taxa mexe), os itens que ela dividiu ficam travados e o rodapé passa a mostrar quanto falta pagar. O **+** de um item travado lança um pedido novo só com quem ficou. Dá pra desfazer o pagamento.
- **Pagou diferente do que devia**: o valor pago é editável (com atalhos de arredondar, ex.: R$ 31,90 → R$ 32 · R$ 35 · R$ 40) e dá pra corrigir depois. O que falta pagar é sempre `total da mesa − já pago`, repartido entre quem está na mesa na proporção do que cada um gastou: quem pagou a mais vira desconto, quem pagou a menos vira acréscimo. Se pagarem mais que a mesa inteira, aparece o troco a devolver.
- **Remover da mesa** fica pra quem foi cadastrado errado: o consumo volta pra divisão de quem ficou.
- **Quantidade** com − e +, e **arrastar pro lado** pra remover o item.
- **Taxa de serviço ajustável**: atalhos de 0, 8, 10, 12 e 15%, ou qualquer valor até 30%.
- **Fechamento por pessoa**, com consumo e taxa separados. Centavos que sobram na divisão vão pra quem vem primeiro na lista, então a soma sempre bate com o total.
- **Compartilhar** no WhatsApp ou copiar o texto.
- **Nova comanda** com confirmação.

## Rodando

```bash
git clone https://github.com/ms-gustavo/party-order-manager.git
cd party-order-manager
npm install
npm run dev
```

Acesse em http://localhost:5173.

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção, com service worker e manifest |
| `npm run preview` | Serve o build localmente (bom pra testar a instalação da PWA) |
| `npm test` | Testes unitários (Vitest) |
| `npm run cy:run` / `npm run cy:open` | Testes end-to-end (Cypress); precisa do `npm run dev` rodando |
| `npm run lint` | ESLint |
| `npm run generate-pwa-assets` | Regenera os ícones a partir de `public/icon.svg` |

## Estrutura

```
src/
  lib/          regras puras: dinheiro em centavos, divisão da conta, texto de compartilhar
  state/        reducer, persistência no localStorage e hook useBill
  hooks/        useToast
  components/   telas e peças da interface
```

Toda a lógica de cálculo fica em `src/lib` e `src/state`, sem React, e é coberta por testes unitários. Os valores são sempre inteiros em centavos pra evitar erro de ponto flutuante.

## Visual

A paleta vem do boteco: azul caneta BIC, amarelo de mesa de plástico, papel carbono da comanda e vermelho de carimbo. As cores são variáveis CSS em `src/index.css` (com modo escuro automático) e ficam expostas no Tailwind com nomes como `bg-pen`, `bg-hi` e `bg-receipt`.

Fontes: Alfa Slab One (títulos e total), Figtree (texto) e IBM Plex Mono (valores), empacotadas via Fontsource pra funcionar offline.

## Testes end-to-end

Os seletores usam `data-testid`. Comandos customizados em `cypress/support/commands.ts`:

- `cy.byTestId(id)`: busca por `data-testid`.
- `cy.addPeople(...nomes)`: adiciona pessoas na mesa.
- `cy.addItem(nome, preço, { quantity, consumers })`: adiciona um item pelo formulário.
- `cy.receiptTotalOf(nome)`: total de uma pessoa no fechamento.
- `.shouldShowMoney("R$ 10,00")`: compara valores ignorando o espaço não-quebrável do `Intl`.
