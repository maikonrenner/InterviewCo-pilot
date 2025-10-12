// Navigation Controller
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');

    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');

            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked nav item
            this.classList.add('active');

            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // Show target page
            const targetElement = document.getElementById(targetPage + '-page');
            if (targetElement) {
                targetElement.classList.add('active');

                // Trigger page-specific initialization
                const event = new CustomEvent('pageChanged', { detail: { page: targetPage } });
                document.dispatchEvent(event);
            }
        });
    });

    // Initialize dashboard on load
    document.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: 'dashboard' } }));
});
