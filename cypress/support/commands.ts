/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('http://localhost:9002/login'); // Ensure we start at the login page
    cy.contains('Inicio de Sesión', { timeout: 10000 }).should('be.visible'); // Wait for the login page to load
    cy.get('input#email').type(email);
    cy.get('input#password').type(password);
    cy.get('button[type="submit"]').contains('Inicio de Sesión').click();
    cy.url().should('include', 'http://localhost:9002/dashboard'); // Verify redirection
    cy.contains('Bienvenido,').should('be.visible'); // A simple check that dashboard has loaded
  }, {
    cacheAcrossSpecs: true // Cache session across multiple spec files
  });
});
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Add type definition for the custom command to Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password?: string): Chainable<void>;
    }
  }
}

export {}; // Ensure this file is treated as a module
