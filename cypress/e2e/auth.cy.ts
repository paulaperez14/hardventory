describe('Authentication Flows', () => {
  const managerEmail = 'manager@stockpilot.com';
  const correctPassword = 'password';
  const dashboardUrl = 'http://localhost:3000/dashboard';
  const loginUrl = 'http://localhost:3000/login';

  beforeEach(() => {
    // Clear any session cookies or local storage before each test
    // to ensure a clean state, especially for auth tests.
    // cy.clearCookies(); // cy.session should handle this better for login
    // cy.clearLocalStorage();
  });

  it('should redirect to login page when trying to access a protected route unauthenticated', () => {
    // Attempt to visit a protected route directly without logging in
    cy.visit(dashboardUrl, { failOnStatusCode: false }); // failOnStatusCode: false if backend returns 401/403 before redirect
    cy.url({ timeout: 10000 }).should('include', loginUrl);
  });

  it('should allow a user with correct credentials to login and redirect to dashboard', () => {
    cy.visit(loginUrl);
    cy.get('input#email').clear().type(managerEmail);
    cy.get('input#password').clear().type(correctPassword);
    cy.get('button[type="submit"]').contains('Iniciar Sesión').click();

    cy.url({ timeout: 10000 }).should('include', dashboardUrl);
    cy.contains('Bienvenido,', { timeout: 10000 }).should('be.visible');
  });

  it('should show "Correo electrónico o contraseña no válidos." for wrong credentials and stay on login page', () => {
    cy.visit(loginUrl);
    cy.get('input#email').clear().type('wrong@stockpilot.com');
    cy.get('input#password').clear().type('wrongpassword');
    cy.get('button[type="submit"]').contains('Iniciar Sesión').click();

    // Check for the toast message
    cy.contains('Correo electrónico o contraseña no válidos.', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', loginUrl);
    cy.contains('Bienvenido,').should('not.exist'); // Ensure not redirected
  });

  it('should allow a logged-in user to logout and redirect to login page', () => {
    // Log in using the custom command for a clean session
    cy.login(managerEmail, correctPassword);
    cy.visit(dashboardUrl); // Visit a page to ensure the header with logout is present

    // Wait for dashboard to fully load to ensure avatar button is present
    cy.contains('Bienvenido,', { timeout: 10000 }).should('be.visible');

    // Perform logout
    // This selector targets the user avatar button; it might need adjustment if the UI changes.
    // A 'data-testid' attribute on the button would be more robust.
    cy.get('header').find('button.relative.h-10.w-10.rounded-full').click();
    cy.get('[role="menuitem"]').contains('Log out').click();

    cy.url({ timeout: 10000 }).should('include', loginUrl);

    // Verify session is cleared by trying to access dashboard again
    cy.visit(dashboardUrl, { failOnStatusCode: false });
    cy.url({ timeout: 10000 }).should('include', loginUrl);
    cy.contains('Inicio de Sesión a Hardventory').should('be.visible'); // Check for login page content
  });

  it('should indicate an invalid email format on the login form', () => {
    cy.visit(loginUrl);
    cy.get('input#email').clear().type('invalidemailformat');

    // Check for the :invalid pseudo-class on the email input,
    // which browsers set for input[type="email"] with invalid values.
    cy.get('input#email:invalid').should('exist');

    // Optionally, attempt to "submit" and verify behavior
    cy.get('input#password').clear().type(correctPassword); // Fill password to allow form submission attempt
    cy.get('button[type="submit"]').contains('Iniciar Sesión').click();

    // We should remain on the login page because the browser should prevent submission
    cy.url().should('include', loginUrl);
    // And no login-related toasts should appear
    cy.contains('Email o Contraseña Incorrecta..').should('not.exist');
    cy.contains('Inicio de Sesión Exitoso').should('not.exist');
  });
});