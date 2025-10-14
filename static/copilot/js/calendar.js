/**
 * Calendar functionality for Interview Co-pilot Dashboard
 * Displays interviews from Google Calendar
 */

let currentDate = new Date();
let calendarInterviews = [];

// Initialize calendar when dashboard page becomes active
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'dashboard') {
        initializeCalendar();
    }
});

let calendarInitialized = false;

function initializeCalendar() {
    if (calendarInitialized) {
        console.log('Calendar already initialized, skipping...');
        return;
    }

    console.log('Initializing calendar...');

    // Set up event listeners
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const syncBtn = document.getElementById('syncCalendarBtn');

    if (!prevBtn || !nextBtn || !syncBtn) {
        console.error('Calendar buttons not found');
        return;
    }

    prevBtn.addEventListener('click', () => changeMonth(-1));
    nextBtn.addEventListener('click', () => changeMonth(1));
    syncBtn.addEventListener('click', fetchCalendarInterviews);

    calendarInitialized = true;

    // Initial render
    renderCalendar();
    fetchCalendarInterviews();
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month/year display
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Clear calendar
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = createDayElement(day, 'other-month', year, month - 1);
        calendarDays.appendChild(dayDiv);
    }

    // Add current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
        const dayDiv = createDayElement(day, isToday ? 'today' : '', year, month);
        calendarDays.appendChild(dayDiv);
    }

    // Add next month's leading days
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, 'other-month', year, month + 1);
        calendarDays.appendChild(dayDiv);
    }
}

function createDayElement(day, className, year, month) {
    const dayDiv = document.createElement('div');
    dayDiv.className = `calendar-day ${className}`;

    // Create date string for comparison
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(year, month, day);

    // Check if this day has interviews
    const dayInterviews = calendarInterviews.filter(interview => {
        const interviewDate = new Date(interview.start);
        return (
            interviewDate.getDate() === day &&
            interviewDate.getMonth() === month &&
            interviewDate.getFullYear() === year
        );
    });

    // Add day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    // Add interviews if any
    if (dayInterviews.length > 0) {
        const isPast = dayDate < new Date();
        dayDiv.classList.add('has-interview');
        if (isPast) {
            dayDiv.classList.add('past');
        }

        // Add indicator
        const indicator = document.createElement('div');
        indicator.className = `day-indicator ${isPast ? 'past' : 'upcoming'}`;
        dayDiv.appendChild(indicator);

        // Add interview count (compact view)
        if (dayInterviews.length > 0) {
            const countDiv = document.createElement('div');
            countDiv.className = 'day-interviews';
            countDiv.textContent = `${dayInterviews.length}`;
            countDiv.title = `${dayInterviews.length} interview${dayInterviews.length > 1 ? 's' : ''}`;
            dayDiv.appendChild(countDiv);
        }

        // Add click handler to show details
        dayDiv.addEventListener('click', () => showInterviewDetails(dayInterviews, dayDate));
    }

    return dayDiv;
}

function showInterviewDetails(interviews, date) {
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let detailsHTML = `<h3>Interviews on ${dateStr}</h3>`;
    detailsHTML += '<div style="max-height: 400px; overflow-y: auto;">';

    interviews.forEach(interview => {
        const time = new Date(interview.start).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const statusBadge = interview.status === 'upcoming'
            ? '<span class="badge badge-success">Upcoming</span>'
            : '<span class="badge badge-pending">Completed</span>';

        detailsHTML += `
            <div style="padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${interview.status === 'upcoming' ? '#27ae60' : '#aab8c2'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="font-size: 16px;">${interview.title}</strong>
                    ${statusBadge}
                </div>
                <div style="color: #657786; font-size: 14px; margin-bottom: 5px;">
                    <strong>Time:</strong> ${time}
                </div>
                ${interview.description ? `
                    <div style="color: #657786; font-size: 14px; margin-bottom: 5px;">
                        <strong>Description:</strong> ${interview.description}
                    </div>
                ` : ''}
                ${interview.location ? `
                    <div style="color: #657786; font-size: 14px; margin-bottom: 5px;">
                        <strong>Location:</strong> ${interview.location}
                    </div>
                ` : ''}
                ${interview.link ? `
                    <div style="margin-top: 10px;">
                        <a href="${interview.link}" target="_blank" class="btn btn-sm btn-primary">Open in Google Calendar</a>
                    </div>
                ` : ''}
            </div>
        `;
    });

    detailsHTML += '</div>';

    // Show in a modal or alert
    showModal('Interview Details', detailsHTML);
}

function showModal(title, content) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.display = 'flex';

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #14171a;">${title}</h2>
            <button id="closeModal" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: #657786;">&times;</button>
        </div>
        <div>${content}</div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close modal on click
    document.getElementById('closeModal').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

async function fetchCalendarInterviews() {
    console.log('Fetching calendar interviews...');

    try {
        // Show loading state
        const syncBtn = document.getElementById('syncCalendarBtn');
        if (!syncBtn) {
            console.error('Sync button not found');
            return;
        }

        const originalText = syncBtn.innerHTML;
        syncBtn.innerHTML = '⏳ Syncing...';
        syncBtn.disabled = true;

        console.log('Making fetch request to /calendar-interviews/...');
        const response = await fetch('/calendar-interviews/?days_ahead=60&days_back=60');
        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            calendarInterviews = data.interviews;
            console.log(`Loaded ${calendarInterviews.length} interviews`);
            renderCalendar();

            // Show success message
            syncBtn.innerHTML = '✓ Synced!';
            setTimeout(() => {
                syncBtn.innerHTML = originalText;
                syncBtn.disabled = false;
            }, 2000);
        } else {
            console.error('Failed to fetch calendar interviews:', data.message);
            syncBtn.innerHTML = '✗ Error';
            setTimeout(() => {
                syncBtn.innerHTML = originalText;
                syncBtn.disabled = false;
            }, 2000);

            // Show error to user if credentials are missing
            if (data.message && data.message.includes('credentials not found')) {
                alert('Google Calendar is not configured. Please set up the Interview Calendar MCP first.');
            }
        }
    } catch (error) {
        console.error('Error fetching calendar interviews:', error);
        const syncBtn = document.getElementById('syncCalendarBtn');
        if (syncBtn) {
            syncBtn.innerHTML = '✗ Error';
            setTimeout(() => {
                syncBtn.innerHTML = '🔄 Sync Calendar';
                syncBtn.disabled = false;
            }, 2000);
        }
    }
}

// Auto-sync on page load
if (document.getElementById('dashboard-page')?.classList.contains('active')) {
    initializeCalendar();
}
