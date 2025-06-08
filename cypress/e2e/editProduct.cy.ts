import 'cypress-file-upload';

describe('Gestión de Productos - Editar Producto', () => {
  const testProductNameBase = 'Cypress Edit Test Product';
  const timestamp = Date.now();
  const initialProductName = `${testProductNameBase} Inicial ${timestamp}`;
  const editedProductName = `${testProductNameBase} Editado ${timestamp}`;
  const initialProductPrice = '150.0';
  const editedProductPrice = '175.50';
  const productQuantity = '75';
  const productLowStock = '15';
  const fixtureImageName = 'milwaukee_fuel.png';
  let editedCategoryName = ''; // To store the name of the category selected during edit

  beforeEach(() => {
    cy.login('admin@stockpilot.com', 'password');
    cy.visit('http://localhost:3000/products');
    cy.contains('Gestión de Productos', { timeout: 10000 }).should('be.visible');

    // --- ADD A PRODUCT TO EDIT ---
    cy.contains('button', 'Añadir Nuevo Producto').click();
    cy.contains('Añadir Producto', { timeout: 10000 }).should('be.visible');
    cy.get('input#name').clear().type(initialProductName, { delay: 50 });
    cy.get('textarea#description').type('This is a product to be edited by Cypress.');
    cy.get('input#price').clear().type(initialProductPrice);
    cy.get('input#quantity').clear().type(productQuantity);
    cy.get('input#lowStockThreshold').clear().type(productLowStock);
    cy.get('#categoryId').click(); // Click to open category dropdown
    cy.get('[role="listbox"] [role="option"]').first().click(); // Select the first category

    cy.get('#supplierId').click(); // Click to open supplier dropdown
    cy.get('[role="listbox"] [role="option"]').first().click(); // Select the first supplier
    cy.get('input#productImageFile').attachFile(fixtureImageName);

    cy.contains('button', 'Añadir Producto').click();
    cy.contains('Producto Añadido', { timeout: 20000 }).should('be.visible');

    cy.visit('http://localhost:3000/products'); // Go back to product list to ensure it's there
    cy.contains('td', initialProductName, { timeout: 10000 }).should('be.visible');
  });

  it('should allow a user to edit an existing product', () => {
    // --- EDIT PRODUCT ---
    cy.contains('td', initialProductName)
      .parent('tr')
      .within(() => {
        cy.get('button[aria-label="Open menu"]').click();
      });
    cy.contains('[role="menuitem"]', 'Edit').click();

    cy.contains('Editar Producto', { timeout: 10000 }).should('be.visible');
    
    // Scroll the image into view before checking visibility
    cy.get('img[alt="Vista previa del producto"]') 
        .scrollIntoView()
        .should('be.visible')
        .and('have.attr', 'src')
        .and('include', 'amazonaws.com')
        .and('include', 'hardventory-local');

    cy.get('input#name').should('have.value', initialProductName).clear().type(editedProductName, { delay: 50 });
    
    // Assert the numerical value of the price input
    cy.get('input#price').invoke('val').then(currentVal => {
      expect(parseFloat(currentVal as string)).to.equal(parseFloat(initialProductPrice));
    });
    cy.get('input#price').clear().type(editedProductPrice, { delay: 50 });
    // Change Category
    cy.get('#categoryId').click(); // Click to open category dropdown
    cy.get('[role="listbox"] [role="option"]').last().then(($option) => {
      editedCategoryName = $option.text().trim(); // Get the text of the last option
      cy.wrap($option).click(); // Select the last category
    });

    // Change Supplier
    cy.get('#supplierId').click(); // Click to open supplier dropdown
    cy.get('[role="listbox"] [role="option"]').last().click(); // Select the last supplier
    
    cy.contains('button', 'Actualizar Producto').click();
    cy.contains('Producto Actualizado', { timeout: 10000 }).should('be.visible');

    // --- VIEW EDITED PRODUCT IN LIST ---
    cy.visit('http://localhost:3000/products');
    cy.contains('td', editedProductName, { timeout: 10000 }).should('be.visible');
    cy.contains('td', editedProductName)
      .parent('tr')
      .within(() => {
        cy.get('td').eq(3).should('contain.text', `$${parseFloat(editedProductPrice).toFixed(2)}`);
        cy.get('img[alt="' + editedProductName + '"]') // Verify image is still the S3 one
          .should('have.attr', 'src')
          .and('include', 'amazonaws.com')
          .and('include', 'hardventory-local');
      });
    cy.contains('td', initialProductName).should('not.exist');
  });
});
