beforeEach(() => {
  cy.visit("/");
});

describe("Page tests", () => {
  it("should render the page", () => {
    cy.get("#app-container")
      .should("exist")
      .within(() => {
        cy.checkPageHeader();
        cy.get("#reset-orders-button").should("contain.text", "Zerar Dados");
        cy.get("#shared-order-container")
          .should("exist")
          .within(() => {
            cy.get("#shared-order-header").should(
              "contain.text",
              "Pedidos para ratear entre todos"
            );
            cy.get("#people-quantity-input").should("exist");
            cy.get("#order-name").should("exist");
            cy.get("#order-amount").should("exist");
            cy.get("#add-order-button").should("contain.text", "Adicionar");
            cy.get("#shared-amount").should("exist");
          });
        cy.get("#individual-order-container")
          .should("exist")
          .within(() => {
            cy.get("#individual-person-name").should("exist");
            cy.get("#individual-person-add-button").should(
              "contain.text",
              "Criar"
            );
          });
        cy.get("#total-order-container")
          .should("exist")
          .within(() => {
            cy.get("#total-amount").should("exist");
          });
      });
  });

  it("should add a new order in shared container", () => {
    cy.addSharedOrder("Cypress Test", 150);
    cy.get("#shared-order-li-0")
      .should("exist")
      .within(() => {
        cy.get("span").should("contain.text", "Cypress Test");
        cy.get("#increment-order-button-0").should("exist");
      });
    cy.get("#shared-amount").should("contain.text", "150");
  });

  it("should add a new order in shared container with division to 10 peoples", () => {
    cy.get("#people-quantity-input").type("0");
    cy.addSharedOrder("Cypress Test", 150);
    cy.get("#shared-order-li-0")
      .should("exist")
      .within(() => {
        cy.get("span").should("contain.text", "Cypress Test");
        cy.get("#increment-order-button-0").should("exist");
      });
    cy.get("#shared-amount").should("contain.text", "15");
  });

  it("should add an item when it already exists", () => {
    cy.addSharedOrder("Cypress Test", 150);
    cy.get("#shared-order-li-0")
      .should("exist")
      .within(() => {
        cy.get("span").should("contain.text", "Cypress Test");
        cy.get("#increment-order-button-0").click();
        cy.get("span").should("contain.text", "2");
      });
  });

  it("should add a client in individual order container", () => {
    cy.addIndividualClient("Cypress Test New Client");
    cy.get("#person-order-container-0")
      .should("exist")
      .within(() => {
        cy.get("#person-order-name-0").should(
          "contain.text",
          "Cypress Test New Client"
        );
        cy.get("#person-order-item-name-0").should("exist");
        cy.get("#person-order-item-amount-0").should("exist");
        cy.get("#person-order-remove-button-0").should(
          "contain.text",
          "Excluir"
        );
        cy.get("#person-order-add-order-button-0").should(
          "contain.text",
          "Adicionar"
        );
        cy.get("#person-order-total-amount-0").should("exist");
      });
  });

  it("should remove a client in individual order container", () => {
    cy.addIndividualClient("Cypress Test New Client");
    cy.get("#person-order-container-0").should("exist");
    cy.removeIndividualClient(0);
    cy.get("#person-order-container-0").should("not.exist");
  });

  it("should add an order in client individual order", () => {
    cy.addIndividualClient("Cypress Test New Client");
    cy.get("#person-order-container-0")
      .should("exist")
      .within(() => {
        cy.addOrderToClient(0, "Cypress Individual Order Test", 50);
        cy.get("#person-order-list-0").should(
          "contain.text",
          "Cypress Individual Order Test"
        );
        cy.get("#person-order-total-amount-0").should("contain.text", "50");
      });
  });

  it("should show the total amount of a bill", () => {
    cy.addSharedOrder("Cypress Test", 150);
    cy.addIndividualClient("Cypress Test New Client");
    cy.addOrderToClient(0, "Cypress Individual Order Test", 50);
    cy.get("#total-amount").should("contain.text", "200");
  });

  it("should clear all data", () => {
    cy.addSharedOrder("Cypress Test", 150);
    cy.addIndividualClient("Cypress Test New Client");
    cy.addOrderToClient(0, "Cypress Individual Order Test", 50);
    cy.get("#reset-orders-button").click();
    cy.get("#shared-order-li-0").should("not.exist");
    cy.get("#person-order-container-0").should("not.exist");
    cy.get("#total-amount").should("contain.text", "0");
  });
});
