/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    checkPageHeader(): Chainable<Subject>;
    addSharedOrder(name: string, amount: number): Chainable<Subject>;
    addIndividualClient(name: string): Chainable<Subject>;
    removeIndividualClient(index: number): Chainable<Subject>;
    addOrderToClient(
      index: number,
      itemName: string,
      amount: number
    ): Chainable<Subject>;
  }
}
