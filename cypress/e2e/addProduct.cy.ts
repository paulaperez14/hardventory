// Import cypress-file-upload for attachFile command
import 'cypress-file-upload';

describe('Gestión de productos - Add Product', () => {
  const testProductNameBase = 'Cypress Add Test Product';
  const timestamp = Date.now();
  const uniqueProductName = `${testProductNameBase} ${timestamp}`;
  const productDescription = 'This is a product added by Cypress test.';
  const productSpecifications = 'High quality, durable, and reliable.';
  const productPrice = '99.99';
  const productQuantity = '100';
  const productLowStock = '10';
  const fixtureImageName = 'cordless_drill.png';

  beforeEach(() => {
    cy.login('admin@stockpilot.com', 'password');
    cy.visit('http://localhost:3000/products');
    cy.contains('Gestión de productos', { timeout: 10000 }).should('be.visible');
  });


  it('should allow a user to add a product with image upload and view it in the list', () => {
    // --- ADD PRODUCT ---
    cy.contains('button', 'Añadir Nuevo Producto').click();
    cy.contains('Añadir Producto', { timeout: 10000 }).should('be.visible');

    cy.get('input#name').clear().type(uniqueProductName);
    cy.get('textarea#description').type(productDescription);
    cy.get('textarea#specifications').type(productSpecifications);
    cy.get('input#price').clear().type(productPrice);
    cy.get('input#quantity').clear().type(productQuantity);
    cy.get('input#lowStockThreshold').clear().type(productLowStock);

    cy.get('#categoryId').click();
    cy.get('[role="listbox"] [role="option"]').first().click(); // Select the first category

    cy.get('#supplierId').click();
    cy.get('[role="listbox"] [role="option"]').first().click(); // Select the first supplier

    cy.get('input#productImageFile').attachFile(fixtureImageName);
    
    cy.contains('button', 'Añadir Producto').click();
    cy.contains('Producto Añadido', { timeout: 20000 }).should('be.visible');

    // --- VIEW PRODUCT IN LIST ---
    cy.visit('http://localhost:3000/products'); 
    cy.contains('td', uniqueProductName, { timeout: 10000 }).should('be.visible');
    cy.contains('td', uniqueProductName)
      .parent('tr')
      .within(() => {
        cy.get('td').eq(3).should('contain.text', `$${parseFloat(productPrice).toFixed(2)}`);
        cy.get('td').eq(4).should('contain.text', productQuantity);
        cy.get('img[alt="' + uniqueProductName + '"]')
          .should('have.attr', 'src')
          .and('include', 'amazonaws.com')
          .and('include', 'hardventory-local');
      });
  });

});
