document.addEventListener('DOMContentLoaded', () => {

    // --- Global Sidebar Toggle Logic for all Admin Pages ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggler = document.getElementById('sidebar-toggler');

    // Only run this code if a sidebar and a toggler button exist on the page
    if (sidebar && sidebarToggler) {
        sidebarToggler.addEventListener('click', () => {
            // This adds or removes the 'toggled' class, which our CSS uses to show/hide the menu
            sidebar.classList.toggle('toggled');
        });
    }

    // --- Global Logout Logic ---
    const logoutLink = document.getElementById('logout-link');
    const logoutLinkDropdown = document.getElementById('logout-link-dropdown');

    const logout = () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        sessionStorage.removeItem('activeUser');
        window.location.href = 'admin-login.html'; // Redirect to the admin login page
    };

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (logoutLinkDropdown) {
        logoutLinkDropdown.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

});
