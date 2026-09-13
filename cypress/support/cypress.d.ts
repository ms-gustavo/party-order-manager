/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    byTestId(id: string): Chainable<JQuery<HTMLElement>>;
    addPeople(...names: string[]): Chainable<Subject>;
    addItem(
      name: string,
      price: string,
      options?: { quantity?: number; consumers?: string[] }
    ): Chainable<Subject>;
    shouldShowMoney(expected: string): Chainable<Subject>;
    receiptTotalOf(name: string): Chainable<JQuery<HTMLElement>>;
  }
}
