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

    // --- Define Office Working Hours ---
    const OFFICE_START_HOUR = 10; // 10 AM
    const OFFICE_END_HOUR = 19;   // 7 PM (19:00 in 24-hour format)
    const INTERVIEW_DURATION_MINS = 30; // Each time slot duration
    const DAYS_OF_WEEK = {
        SUNDAY: 0,
        MONDAY: 1,
        SATURDAY: 6
    };

    // Mock data for *pre-booked* slots (for demo purposes)
    // These are specific slots that are already taken within the working hours
    const mockBookedSlots = {
        '2025-05-27': ['10:00 AM', '02:00 PM'], // Example: May 27th, 2025, 10 AM and 2 PM are booked
        '2025-06-05': ['11:00 AM'] // Example: June 5th, 2025, 11 AM is booked
    };

    // --- Helper function to format time ---
    const formatTime = (hour, minute) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const formattedMinute = String(minute).padStart(2, '0');
        return `${formattedHour}:${formattedMinute} ${ampm}`;
    };

    // --- Generate available time slots based on office hours ---
    const generateDailySlots = (dateKey) => {
        const slots = [];
        const booked = mockBookedSlots[dateKey] || [];

        for (let hour = OFFICE_START_HOUR; hour < OFFICE_END_HOUR; hour++) {
            // Add full hour slots
            const slot1 = formatTime(hour, 0);
            if (!booked.includes(slot1)) {
                slots.push(slot1);
            }

            // Add half-hour slots if duration allows and it's before end hour
            if (INTERVIEW_DURATION_MINS <= 30 && (hour * 60 + 30) < (OFFICE_END_HOUR * 60)) {
                const slot2 = formatTime(hour, 30);
                if (!booked.includes(slot2)) {
                    slots.push(slot2);
                }
            }
        }
        return slots;
    };


    // --- Calendar Rendering ---
    const renderCalendar = () => {
        calendarGrid.innerHTML = ''; // Clear previous days
        timeSlotsContainer.innerHTML = '<p class="no-slots">Select a date to see available times.</p>';
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

            // Disable past dates OR Sundays
            if (fullDate < today || fullDate.getDay() === DAYS_OF_WEEK.SUNDAY) {
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

        // Get available slots based on office hours and mock booked slots
        const slots = generateDailySlots(dateKey);
        const bookedSlotsForThisDay = mockBookedSlots[dateKey] || [];

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="no-slots">No time slots available for this date.</p>';
            return;
        }

        slots.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('time-slot');
            slotDiv.textContent = slot;

            if (bookedSlotsForThisDay.includes(slot)) {
                 slotDiv.classList.add('booked');
            } else {
                slotDiv.addEventListener('click', () => selectTime(slotDiv, slot));
            }

            timeSlotsContainer.appendChild(slotDiv);
        });
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
        // The backend would then:
        // 1. Validate the booking (e.g., ensure slot is still available)
        // 2. Interact with Zoom/Google Calendar APIs to create the meeting
        // 3. Store the booking in a database
        // 4. Send confirmation emails

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
