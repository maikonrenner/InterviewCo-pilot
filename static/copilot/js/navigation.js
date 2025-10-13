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

// Load summaries when Interview page is opened
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'interview') {
        loadInterviewSummaries();
    }
});

function loadInterviewSummaries() {
    // Try to load existing summaries from the server
    fetch('/get-summaries/')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update interview page summaries
            const resumeSummaryElement = document.getElementById('resumeSummary');
            const jobSummaryElement = document.getElementById('jobSummary');

            if (resumeSummaryElement) {
                if (data.resume_summary && data.resume_summary !== 'Loading...' && !data.resume_summary.includes('No resume')) {
                    resumeSummaryElement.textContent = data.resume_summary;
                } else {
                    resumeSummaryElement.textContent = 'No resume summary generated yet. Please upload and generate summaries in the Resume Builder page.';
                }
            }

            if (jobSummaryElement) {
                if (data.job_summary && data.job_summary !== 'Loading...' && !data.job_summary.includes('No job description')) {
                    jobSummaryElement.textContent = data.job_summary;
                } else {
                    jobSummaryElement.textContent = 'No job description summary generated yet. Please upload and generate summaries in the Resume Builder page.';
                }
            }
        }
    })
    .catch(error => {
        console.log('Error loading summaries:', error);
        const resumeSummaryElement = document.getElementById('resumeSummary');
        const jobSummaryElement = document.getElementById('jobSummary');

        if (resumeSummaryElement) {
            resumeSummaryElement.textContent = 'Failed to load resume summary. Please try refreshing the page.';
        }
        if (jobSummaryElement) {
            jobSummaryElement.textContent = 'Failed to load job description summary. Please try refreshing the page.';
        }
    });
}
