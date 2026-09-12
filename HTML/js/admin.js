document.addEventListener('DOMContentLoaded', () => {

    // --- Global Sidebar Toggle Logic for all Admin Pages ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggler = document.getElementById('sidebar-toggler');
    let sidebarBackdrop = document.getElementById('sidebar-backdrop');

    // Dynamically insert backdrop if it does not exist in DOM
    if (!sidebarBackdrop && sidebar) {
        sidebarBackdrop = document.createElement('div');
        sidebarBackdrop.id = 'sidebar-backdrop';
        sidebarBackdrop.className = 'sidebar-backdrop';
        document.body.appendChild(sidebarBackdrop);
    }

    // Only run if sidebar and toggler button exist, preventing duplicate event listeners
    if (sidebar && sidebarToggler && !sidebarToggler.dataset.sbBound) {
        sidebarToggler.dataset.sbBound = 'true';
        sidebarToggler.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('toggled');
            if (sidebarBackdrop) sidebarBackdrop.classList.toggle('active');
        });
    }

    if (sidebar && sidebarBackdrop && !sidebarBackdrop.dataset.sbBound) {
        sidebarBackdrop.dataset.sbBound = 'true';
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
