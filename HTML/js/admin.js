document.addEventListener('DOMContentLoaded', () => {

    // --- Global Sidebar Toggle Logic for all Admin Pages ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    // Only run this code if a sidebar and a toggler button exist on the page
    if (sidebar && sidebarToggler) {
        sidebarToggler.addEventListener('click', () => {
            // This adds or removes the 'toggled' class, which our CSS uses to show/hide the menu
            sidebar.classList.toggle('toggled');
            if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
        });
    }

    if (sidebar && sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            sidebar.classList.remove('toggled');
            sidebarBackdrop.classList.remove('active');
        });
    }

    if (sidebar) {
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992) {
                    sidebar.classList.remove('toggled');
                    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
                }
            });
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
