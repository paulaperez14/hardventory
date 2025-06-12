import 'cypress-file-upload';

describe('Gestión de Productos - Eliminar Producto', () => {
  const testProductNameBase = 'Cypress Delete Test Product';
  const timestamp = Date.now();
  const productNameToDelete = `${testProductNameBase} ${timestamp}`;
  const productPrice = '49.99';
  const productQuantity = '25';
  const productLowStock = '3';
  const fixtureImageName = 'taladro.jpg';

  beforeEach(() => {
    cy.login('admin@stockpilot.com', 'password');
    cy.visit('http://localhost:3000/products');
    cy.contains('Gestión de Productos', { timeout: 10000 }).should('be.visible');

    // --- ADD A PRODUCT TO DELETE ---
cy.contains('button', 'Añadir Nuevo Producto').click();
    cy.contains('Añadir Producto', { timeout: 10000 }).should('be.visible');
    cy.get('input#name').clear().type(productNameToDelete, { delay: 50 });
    cy.get('textarea#description').type('This is a product to be deleted by Cypress.');
    cy.get('input#price').clear().type(productPrice);
    cy.get('input#quantity').clear().type(productQuantity);
    cy.get('input#lowStockThreshold').clear().type(productLowStock);
    cy.get('#categoryId').click();
    cy.get('[role="listbox"] [role="option"]').first().click();
    cy.get('#supplierId').click();
    cy.get('[role="listbox"] [role="option"]').first().click();
    cy.get('input#productImageFile').attachFile(fixtureImageName);
    
    cy.contains('button', 'Añadir Producto').click();
    cy.contains('Producto Añadido', { timeout: 20000 }).should('be.visible');

    cy.visit('http://localhost:3000/products'); // Go back to product list
    cy.contains('td', productNameToDelete, { timeout: 10000 }).should('be.visible');
  });

  it('should allow a user to delete an existing product', () => {
    // --- DELETE PRODUCT ---
    cy.contains('td', productNameToDelete)
      .parent('tr')
      .within(() => {
        cy.get('button[aria-label="Open menu"]').click();
      });
    // Using a regex to match "Delete" or "Eliminar" case-insensitively
    cy.get('[role="menuitem"]').contains(/Delete|Eliminar/i).click();

    cy.contains('Confirmar Eliminación', { timeout: 10000 }).should('be.visible');
    // Using a regex to match "Delete" or "Eliminar" on the button in the dialog
    cy.get('div[role="dialog"]').contains('button', /Eliminar|Delete/i).click();
    
    // Check for the success toast
    cy.contains('Producto eliminado correctamente!', { timeout: 10000 }).should('be.visible');

    // --- VERIFY PRODUCT IS DELETED ---
    cy.visit('http://localhost:3000/products');
    cy.contains('td', productNameToDelete, { timeout: 10000 }).should('not.exist');
  });
});
