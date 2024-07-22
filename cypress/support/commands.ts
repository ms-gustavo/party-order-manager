/// <reference types="cypress" />

Cypress.Commands.add("checkPageHeader", () => {
  cy.get("#app-container-header").should(
    "contain.text",
    "Gerenciador de Comanda"
  );
});

Cypress.Commands.add("addSharedOrder", (name: string, amount: number) => {
  cy.get("#order-name").type(name);
  cy.get("#order-amount").type(amount.toString());
  cy.get("#add-order-button").click();
});

Cypress.Commands.add("addIndividualClient", (name: string) => {
  cy.get("#individual-person-name").type(name);
  cy.get("#individual-person-add-button").click();
});

Cypress.Commands.add("removeIndividualClient", (index: number) => {
  cy.get(`#person-order-remove-button-${index}`).click();
});

Cypress.Commands.add(
  "addOrderToClient",
  (index: number, itemName: string, amount: number) => {
    cy.get(`#person-order-item-name-${index}`).type(itemName);
    cy.get(`#person-order-item-amount-${index}`).type(amount.toString());
    cy.get(`#person-order-add-order-button-${index}`).click();
  }
);
