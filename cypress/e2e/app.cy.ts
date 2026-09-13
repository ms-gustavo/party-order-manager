beforeEach(() => {
  cy.viewport("iphone-x");
  cy.visit("/", { onBeforeLoad: (win) => win.localStorage.clear() });
});

describe("Comanda vazia", () => {
  it("pede pra colocar gente na mesa antes dos pedidos", () => {
    cy.contains("h1", "Comanda");
    cy.byTestId("people-count").should("have.text", "0 pessoas");
    cy.byTestId("add-item-button").should("be.disabled");
    cy.byTestId("bill-total").shouldShowMoney("R$ 0,00");
    cy.byTestId("share-button").should("be.disabled");
    cy.byTestId("receipt").should("not.exist");
  });
});

describe("Pessoas", () => {
  it("adiciona várias pessoas em sequência e remove uma", () => {
    cy.addPeople("Gustavo", "Ana", "Léo");
    cy.byTestId("person-chip").should("have.length", 3);
    cy.byTestId("people-count").should("have.text", "3 pessoas");

    cy.contains('[data-testid="person-chip"]', "Ana").find('[data-testid="person-remove"]').click();
    cy.byTestId("person-chip").should("have.length", 2).and("not.contain", "Ana");
  });

  it("mantém o botão de adicionar visível com a mesa cheia", () => {
    cy.addPeople("Gustavo", "Ana", "Léo", "Bia", "Rafa", "Juliana", "Pedro");
    cy.byTestId("add-person-button").should("be.visible");
  });
});

describe("Pedidos e divisão", () => {
  beforeEach(() => {
    cy.addPeople("Gustavo", "Ana", "Léo");
    cy.byTestId("tip-toggle").click();
    cy.byTestId("tip-preset-0").click();
  });

  it("divide item de todos igualmente, sem perder centavos", () => {
    cy.addItem("Batata frita", "10");
    cy.byTestId("item-name").should("have.text", "Batata frita");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 3,34");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 3,33");
    cy.receiptTotalOf("Léo").shouldShowMoney("R$ 3,33");
    cy.byTestId("bill-total").shouldShowMoney("R$ 10,00");
  });

  it("cobra só de quem consumiu, com quantidade", () => {
    cy.addItem("Chopp", "14,00", { quantity: 5, consumers: ["Gustavo", "Léo"] });
    cy.byTestId("item-total").shouldShowMoney("R$ 70,00");
    cy.byTestId("consumers-toggle").should("contain.text", "Gustavo, Léo");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 35,00");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 0,00");
    cy.receiptTotalOf("Léo").shouldShowMoney("R$ 35,00");
  });

  it("muda quem consumiu direto no item", () => {
    cy.addItem("Caipirinha", "22");
    cy.byTestId("consumers-toggle").click();
    cy.contains('[data-testid="consumer-option"]', "Ana").click();
    cy.byTestId("consumers-toggle").should("contain.text", "Ana");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 22,00");

    // A última pessoa não pode ser desmarcada
    cy.contains('[data-testid="consumer-option"]', "Ana").click();
    cy.byTestId("toast").should("contain.text", "Alguém tem que ter consumido");

    cy.byTestId("consumer-all").click();
    cy.byTestId("consumers-toggle").should("contain.text", "Todos");
  });

  it("ajusta a quantidade com − e +", () => {
    cy.addItem("Água", "6");
    cy.byTestId("qty-plus").click().click();
    cy.byTestId("item-quantity").should("have.text", "3");
    cy.byTestId("items-count").should("have.text", "3 itens");
    cy.byTestId("qty-minus").click();
    cy.byTestId("item-quantity").should("have.text", "2");
    cy.byTestId("qty-minus").click();
    cy.byTestId("item-quantity").should("have.text", "1");
    cy.byTestId("qty-minus").click();
    cy.byTestId("toast").should("contain.text", "arraste pro lado");
  });

  it("remove item pelo painel do card", () => {
    cy.addItem("Porção", "38");
    cy.byTestId("consumers-toggle").click();
    cy.byTestId("item-remove").click();
    cy.byTestId("item-card").should("not.exist");
    cy.byTestId("bill-total").shouldShowMoney("R$ 0,00");
  });

  it("remove item arrastando pro lado", () => {
    cy.addItem("Porção", "38");
    // Dispara eventos nativos: o cy.trigger recalcula as coordenadas pro centro do elemento
    cy.byTestId("item-name").then(($el) => {
      const fire = (type: string, clientX: number) =>
        $el[0].dispatchEvent(new PointerEvent(type, { bubbles: true, clientX, clientY: 300, pointerId: 1 }));
      fire("pointerdown", 300);
      fire("pointermove", 250);
      fire("pointermove", 180);
      fire("pointerup", 180);
    });
    // O botão fica atrás do card; só a faixa da direita aparece
    cy.contains("button", "Remover").should("be.visible").click("right");
    cy.byTestId("item-card").should("not.exist");
  });

  it("valida o formulário de novo item", () => {
    cy.byTestId("add-item-button").click();
    cy.byTestId("new-item-submit").click();
    cy.byTestId("new-item-error").should("contain.text", "Dá um nome");
    cy.byTestId("new-item-name").type("Chopp");
    cy.byTestId("new-item-submit").click();
    cy.byTestId("new-item-error").should("contain.text", "preço");
    cy.byTestId("new-item-price").type("0");
    cy.byTestId("new-item-submit").click();
    cy.byTestId("new-item-error").should("contain.text", "preço");
    cy.get("body").type("{esc}");
    cy.byTestId("add-item-sheet").should("not.exist");
  });
});

describe("Taxa de serviço", () => {
  beforeEach(() => {
    cy.addPeople("Gustavo", "Ana");
    cy.addItem("Vinho", "80", { consumers: ["Ana"] });
  });

  it("começa em 10% e aplica sobre o consumo de cada um", () => {
    cy.byTestId("tip-toggle").should("contain.text", "10%");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 88,00");
    cy.byTestId("receipt-tip").shouldShowMoney("R$ 8,00");
    cy.byTestId("bill-total").shouldShowMoney("R$ 88,00");
  });

  it("aceita atalhos e valor personalizado", () => {
    cy.byTestId("tip-toggle").click();
    cy.byTestId("tip-preset-15").click();
    cy.byTestId("bill-total").shouldShowMoney("R$ 92,00");

    cy.byTestId("tip-input").clear().type("12,5");
    cy.byTestId("tip-toggle").should("contain.text", "12,5%");
    cy.byTestId("bill-total").shouldShowMoney("R$ 90,00");

    cy.byTestId("tip-plus").click();
    cy.byTestId("tip-toggle").should("contain.text", "13,5%");
  });

  it("some do fechamento quando fica em 0%", () => {
    cy.byTestId("tip-toggle").click();
    cy.byTestId("tip-preset-0").click();
    cy.byTestId("receipt-tip").should("not.exist");
    cy.byTestId("bill-total").shouldShowMoney("R$ 80,00");
  });
});

describe("Compartilhar, persistência e nova comanda", () => {
  beforeEach(() => {
    cy.byTestId("table-name-input").type("Bar do Zé");
    cy.addPeople("Gustavo", "Ana");
    cy.addItem("Batata", "30");
  });

  it("monta o texto pro WhatsApp", () => {
    cy.byTestId("share-button").click();
    cy.byTestId("share-text")
      .should("contain.text", "*Bar do Zé*")
      .and("contain.text", "Gustavo: *R$ 16,50*")
      .and("contain.text", "Ana: *R$ 16,50*")
      .and("contain.text", "Total c/ 10% de serviço: R$ 33,00");
  });

  it("mantém a comanda depois de recarregar a página", () => {
    cy.reload();
    cy.byTestId("table-name-input").should("have.value", "Bar do Zé");
    cy.byTestId("person-chip").should("have.length", 2);
    cy.byTestId("item-name").should("have.text", "Batata");
    cy.byTestId("bill-total").shouldShowMoney("R$ 33,00");
  });

  it("pede confirmação antes de apagar tudo", () => {
    cy.byTestId("reset-button").click();
    cy.byTestId("reset-cancel").click();
    cy.byTestId("item-card").should("have.length", 1);

    cy.byTestId("reset-button").click();
    cy.byTestId("reset-confirm").click();
    cy.byTestId("item-card").should("not.exist");
    cy.byTestId("person-chip").should("not.exist");
    cy.byTestId("table-name-input").should("have.value", "");
  });
});

describe("Alguém paga e vai embora", () => {
  beforeEach(() => {
    cy.addPeople("Gustavo", "Ana", "Léo");
    cy.addItem("Batata", "30"); // R$ 10 cada + 10% de serviço
  });

  it("fecha a conta sem cobrar de novo quem ficou", () => {
    cy.openPerson("Ana");
    cy.byTestId("person-sheet-total").shouldShowMoney("R$ 11,00");
    cy.byTestId("person-settle").should("contain.text", "Ana pagou");
    cy.byTestId("person-settle").click();

    cy.get('[data-testid="receipt-row"][data-person-name="Ana"]').should("have.attr", "data-paid", "true");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 11,00");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 11,00");
    cy.receiptTotalOf("Léo").shouldShowMoney("R$ 11,00");
    cy.byTestId("bill-label").should("contain.text", "Falta pagar");
    cy.byTestId("bill-total").shouldShowMoney("R$ 22,00");
    cy.byTestId("receipt-remaining").shouldShowMoney("R$ 22,00");
  });

  it("trava o que a pessoa dividiu e permite pedir de novo só com quem ficou", () => {
    cy.settle("Ana");
    cy.byTestId("item-card").should("have.attr", "data-locked", "true");

    cy.byTestId("qty-minus").click();
    cy.byTestId("toast").should("contain.text", "travado");
    cy.byTestId("consumers-toggle").click();
    cy.byTestId("item-locked-note").should("contain.text", "Ana já pagou");

    cy.byTestId("qty-plus").click();
    cy.byTestId("add-item-sheet").within(() => {
      cy.contains("h2", "Pedir de novo");
      cy.byTestId("new-item-name").should("have.value", "Batata");
      cy.byTestId("new-item-price").should("have.value", "30,00");
      cy.byTestId("consumer-option").should("have.length", 2).and("not.contain", "Ana");
      cy.byTestId("new-item-submit").click();
    });

    cy.byTestId("item-card").should("have.length", 2);
    cy.byTestId("item-card").eq(1).should("have.attr", "data-locked", "false");
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 11,00");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 27,50");
  });

  it("mudar a taxa depois não mexe em quem já pagou", () => {
    cy.settle("Ana");
    cy.byTestId("tip-toggle").click();
    cy.byTestId("tip-preset-0").click();
    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 11,00");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 10,00");
  });

  it("desfaz o pagamento", () => {
    cy.settle("Ana");
    cy.openPerson("Ana");
    cy.byTestId("person-undo").click();
    cy.byTestId("item-card").should("have.attr", "data-locked", "false");
    cy.byTestId("bill-label").should("contain.text", "Total c/");
    cy.byTestId("bill-total").shouldShowMoney("R$ 33,00");
  });

  it("marca quem pagou no texto do WhatsApp", () => {
    cy.settle("Ana");
    cy.byTestId("share-button").click();
    cy.byTestId("share-text")
      .should("contain.text", "Ana: R$ 11,00 ✅ pago")
      .and("contain.text", "Gustavo: *R$ 11,00*")
      .and("contain.text", "Falta pagar: *R$ 22,00*");
  });

  it("quem chega depois não entra no que foi pedido antes", () => {
    cy.addPeople("Bia");
    cy.receiptTotalOf("Bia").shouldShowMoney("R$ 0,00");
    cy.byTestId("consumers-toggle").should("contain.text", "Gustavo, Ana, Léo");
  });

  it("remover da mesa fica só pra cadastro errado", () => {
    cy.contains('[data-testid="person-chip"]', "Léo").find('[data-testid="person-remove"]').should("not.exist");
    cy.openPerson("Léo");
    cy.byTestId("person-remove-confirm").click();
    cy.byTestId("person-chip").should("have.length", 2);
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 16,50");
  });

  it("quem paga a mais vira desconto pra quem ficou", () => {
    cy.openPerson("Ana");
    cy.byTestId("person-round").should("have.length", 3);
    cy.contains('[data-testid="person-round"]', "15,00").click();
    cy.byTestId("person-amount-hint").should("contain.text", "a mais: vira desconto");
    cy.byTestId("person-settle").should("contain.text", "15,00").click();

    cy.receiptTotalOf("Ana").shouldShowMoney("R$ 15,00");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 9,00");
    cy.receiptTotalOf("Léo").shouldShowMoney("R$ 9,00");
    cy.byTestId("receipt-row-adjustment").first().should("contain.text", "de desconto");
    cy.byTestId("bill-total").shouldShowMoney("R$ 18,00");

    cy.openPerson("Gustavo");
    cy.byTestId("person-sheet-total").shouldShowMoney("R$ 9,00");
    cy.byTestId("person-sheet-adjustment").should("contain.text", "Desconto");
  });

  it("quem paga a menos deixa o que faltou pra quem ficou", () => {
    cy.openPerson("Ana");
    cy.byTestId("person-amount").clear().type("5");
    cy.byTestId("person-amount-hint").should("contain.text", "vão pra conta de quem ficou");
    cy.byTestId("person-settle").click();
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 14,00");
    cy.receiptTotalOf("Léo").shouldShowMoney("R$ 14,00");
    cy.byTestId("bill-total").shouldShowMoney("R$ 28,00");
  });

  it("corrige o valor pago depois", () => {
    cy.settle("Ana");
    cy.openPerson("Ana");
    cy.byTestId("person-update-payment").should("not.exist");
    cy.byTestId("person-amount").clear().type("22");
    cy.byTestId("person-update-payment").click();
    cy.byTestId("toast").should("contain.text", "corrigido");
    cy.receiptTotalOf("Gustavo").shouldShowMoney("R$ 5,50");
  });

  it("mostra o troco quando pagam mais que a mesa toda", () => {
    cy.openPerson("Ana");
    cy.byTestId("person-amount").clear().type("50");
    cy.byTestId("person-settle").click();
    cy.byTestId("bill-label").should("contain.text", "troco");
    cy.byTestId("bill-total").shouldShowMoney("R$ 17,00");
    cy.byTestId("receipt-change").shouldShowMoney("R$ 17,00");
  });

  it("não fecha a conta com valor inválido", () => {
    cy.openPerson("Ana");
    cy.byTestId("person-amount").clear().type("abc");
    cy.byTestId("person-settle").should("be.disabled");
    cy.byTestId("person-amount-hint").should("contain.text", "Digite quanto foi pago");
  });

  it("não deixa remover quem divide item com alguém que já pagou", () => {
    cy.settle("Ana");
    cy.openPerson("Léo");
    cy.byTestId("person-remove-confirm").should("not.exist");
    cy.byTestId("person-sheet").should("contain.text", "divide itens com quem já pagou");
  });
});
