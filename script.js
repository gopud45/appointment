document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYearElem = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');
    const nextStep1Btn = document.getElementById('nextStep1');

    const stepIndicators = document.querySelectorAll('.step-indicator .step');
    const stepContents = document.querySelectorAll('.step-content');
    const bookingForm = document.getElementById('bookingForm');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDate = null;
    let selectedTime = null;

    // --- Define Interview Schedule Rules ---
    const INTERVIEW_DAYS = {
        MONDAY: 1,
        WEDNESDAY: 3,
        FRIDAY: 5
    };
    // These are the *only* two slots that will ever be offered on interview days
    const FIXED_INTERVIEW_SLOTS = ['11:00 AM', '04:00 PM'];

    // Mock data for *pre-booked* slots (for demo purposes)
    // These are specific slots that are already taken within the allowed times.
    // Format: 'YYYY-MM-DD': ['HH:MM AM/PM', ...]
    const mockBookedSlots = {
        '2025-05-23': ['04:00 PM'], // Example: Friday, May 23rd, 2025, 4 PM is booked
        '2025-05-26': ['11:00 AM']  // Example: Monday, May 26th, 2025, 11 AM is booked
    };

    // --- Calendar Rendering ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = ''; // Clear previous days
        timeSlotsContainer.innerHTML = '<p class="no-slots">Select an available date to see time slots.</p>';
        nextStep1Btn.disabled = true;

        const date = new Date(currentYear, currentMonth, 1);
        const firstDayIndex = date.getDay(); // 0 for Sunday, 1 for Monday
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date for comparison

        currentMonthYearElem.textContent = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.classList.add('day-name');
            dayNameDiv.textContent = day;
            calendarGrid.appendChild(dayNameDiv);
        });

        // Add blank days for the start of the month
        for (let i = 0; i < firstDayIndex; i++) {
            const blankDiv = document.createElement('div');
            blankDiv.classList.add('calendar-day', 'inactive');
            calendarGrid.appendChild(blankDiv);
        }

        // Add days of the month
        for (let i = 1; i <= lastDay; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.textContent = i;

            const fullDate = new Date(currentYear, currentMonth, i);
            fullDate.setHours(0, 0, 0, 0); // Normalize for comparison
            const dayOfWeek = fullDate.getDay();

            // Disable past dates OR dates that are NOT Mon, Wed, or Fri
            if (fullDate < today ||
                (dayOfWeek !== INTERVIEW_DAYS.MONDAY &&
                 dayOfWeek !== INTERVIEW_DAYS.WEDNESDAY &&
                 dayOfWeek !== INTERVIEW_DAYS.FRIDAY)) {
                dayDiv.classList.add('inactive');
            } else {
                dayDiv.addEventListener('click', () => selectDate(dayDiv, fullDate));
            }

            // Mark selected date
            if (selectedDate && selectedDate.toDateString() === fullDate.toDateString()) {
                dayDiv.classList.add('selected');
            }

            calendarGrid.appendChild(dayDiv);
        }
    };

    const selectDate = (dayDiv, date) => {
        // Remove 'selected' from previously selected day
        const previouslySelected = document.querySelector('.calendar-day.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        dayDiv.classList.add('selected');
        selectedDate = date;
        renderTimeSlots(date);
        nextStep1Btn.disabled = !selectedTime; // Re-enable if time is already selected
    };

    const renderTimeSlots = (date) => {
        timeSlotsContainer.innerHTML = '';
        selectedTime = null; // Reset selected time when date changes
        nextStep1Btn.disabled = true;

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const bookedSlotsForThisDay = mockBookedSlots[dateKey] || []; // Get specific booked slots for this day

        // Always attempt to display both 11 AM and 4 PM
        let slotsAvailableCount = 0;
        FIXED_INTERVIEW_SLOTS.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('time-slot');
            slotDiv.textContent = slot;

            if (bookedSlotsForThisDay.includes(slot)) {
                slotDiv.classList.add('booked'); // Mark as booked
                // Do NOT add event listener, as it's booked
            } else {
                slotDiv.addEventListener('click', () => selectTime(slotDiv, slot));
                slotsAvailableCount++; // Increment if available for booking
            }
            timeSlotsContainer.appendChild(slotDiv);
        });

        // If after checking both fixed slots, none are available
        if (slotsAvailableCount === 0 && FIXED_INTERVIEW_SLOTS.length > 0) {
            timeSlotsContainer.innerHTML = '<p class="no-slots">No time slots available for this date.</p>';
        }
        // Special case: If FIXED_INTERVIEW_SLOTS is empty, handle that too
        else if (FIXED_INTERVIEW_SLOTS.length === 0) {
             timeSlotsContainer.innerHTML = '<p class="no-slots">No time slots defined for interviews.</p>';
        }

    };

    const selectTime = (slotDiv, time) => {
        // Remove 'selected' from previously selected slot
        const previouslySelected = document.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        slotDiv.classList.add('selected');
        selectedTime = time;
        nextStep1Btn.disabled = false; // Enable next step button
    };

    // --- Navigation ---
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        selectedDate = null; // Reset selection on month change
        selectedTime = null;
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        selectedDate = null; // Reset selection on month change
        selectedTime = null;
        renderCalendar();
    });

    // --- Step Control ---
    const goToStep = (stepNumber) => {
        stepContents.forEach(content => content.classList.remove('active'));
        stepIndicators.forEach(indicator => indicator.classList.remove('active'));

        document.getElementById(`step-${stepNumber}`).classList.add('active');
        document.querySelector(`.step[data-step="${stepNumber}"]`).classList.add('active');

        // Scroll to top of the container
        document.querySelector('.scheduler-container').scrollTop = 0;
    };

    nextStep1Btn.addEventListener('click', () => {
        if (selectedDate && selectedTime) {
            goToStep(2);
        } else {
            alert('Please select both a date and a time.');
        }
    });

    document.querySelectorAll('.prev-step-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetStep = parseInt(e.target.dataset.step);
            goToStep(targetStep);
        });
    });

    // --- Form Submission (Mock) ---
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const candidateName = document.getElementById('candidateName').value;
        const candidateEmail = document.getElementById('candidateEmail').value;
        const jobRole = document.getElementById('jobRole').value;

        // In a real application, you would send this data to your backend server
        // For this mock-up, we just display the confirmation details
        document.getElementById('confDate').textContent = selectedDate.toDateString();
        document.getElementById('confTime').textContent = selectedTime;
        document.getElementById('confName').textContent = candidateName;
        document.getElementById('confEmail').textContent = candidateEmail;
        document.getElementById('confRole').textContent = jobRole;

        goToStep(3);
    });

    // Initial render
    renderCalendar();
});
