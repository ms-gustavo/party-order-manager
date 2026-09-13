/// <reference types="cypress" />

Cypress.Commands.add("byTestId", (id: string) => cy.get(`[data-testid="${id}"]`));

Cypress.Commands.add("addPeople", (...names: string[]) => {
  cy.byTestId("add-person-button").click();
  names.forEach((name) => {
    cy.byTestId("add-person-input").type(`${name}{enter}`);
  });
  cy.byTestId("add-person-input").blur();
});

Cypress.Commands.add(
  "addItem",
  (name: string, price: string, options: { quantity?: number; consumers?: string[] } = {}) => {
    cy.byTestId("add-item-button").click();
    cy.byTestId("add-item-sheet").within(() => {
      cy.byTestId("new-item-name").type(name);
      cy.byTestId("new-item-price").type(price);
      for (let i = 1; i < (options.quantity ?? 1); i++) {
        cy.byTestId("new-item-qty-plus").click();
      }
      options.consumers?.forEach((person) => {
        cy.contains('[data-testid="consumer-option"]', person).click();
      });
      cy.byTestId("new-item-submit").click();
    });
    cy.byTestId("add-item-sheet").should("not.exist");
  }
);

Cypress.Commands.add(
  "shouldShowMoney",
  { prevSubject: true },
  (subject: JQuery<HTMLElement>, expected: string) => {
    // O Intl usa espaço não-quebrável depois de "R$"
    cy.wrap(subject).should(($el) => {
      expect($el.text().replace(/\s/g, " ")).to.eq(expected);
    });
  }
);

Cypress.Commands.add("receiptTotalOf", (name: string) =>
  cy.get(`[data-testid="receipt-row"][data-person-name="${name}"] [data-testid="receipt-row-total"]`)
);

Cypress.Commands.add("openPerson", (name: string) => {
  cy.contains('[data-testid="person-open"]', name).click();
  cy.byTestId("person-sheet").should("be.visible");
});

Cypress.Commands.add("settle", (name: string) => {
  cy.openPerson(name);
  cy.byTestId("person-settle").click();
  cy.byTestId("person-sheet").should("not.exist");
});
