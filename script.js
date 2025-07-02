document.addEventListener('DOMContentLoaded', function() {
    // Base URL for your backend API
    const API_BASE_URL = 'http://localhost:3000/api';

    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const dayPicker = document.getElementById('dayPicker');
    const dateInput = document.getElementById('date');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const timeInput = document.getElementById('time');
    const serviceSelect = document.getElementById('service');
    const hairstylistSelect = document.getElementById('hairstylist');

    // Helper function to get services (from backend)
    async function getServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/services`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching services:', error);
            // Fallback to default services if backend is not available or errors
            return [
                { name: 'حلاقة شعر' },
                { name: 'حلاقة شعر وذقن' },
                { name: 'تسريح شعر' }
            ];
        }
    }

    // Populate service dropdown
    async function populateServicesDropdown() {
        const services = await getServices();
        serviceSelect.innerHTML = '<option value="">اختر الخدمة</option>'; // Default option
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.name; // Use service name as value
            option.textContent = `${service.name}`;
            serviceSelect.appendChild(option);
        });
    }

    // Generate three days: today, tomorrow, day after tomorrow
    function getNextThreeDays() {
        const days = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push({
                label: i === 0 ? 'اليوم' : (i === 1 ? 'غداً' : 'بعد غد'),
                value: d.toISOString().split('T')[0],
                display: d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })
            });
        }
        return days;
    }

    function renderDayPicker() {
        dayPicker.innerHTML = '';
        const days = getNextThreeDays();
        days.forEach(day => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'day-card';
            btn.textContent = `${day.label} (${day.display})`;
            btn.onclick = function() {
                document.querySelectorAll('.day-card.selected').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                dateInput.value = day.value;
                renderTimeSlots(day.value);
            };
            dayPicker.appendChild(btn);
        });
        // Auto-select today
        const firstBtn = dayPicker.querySelector('.day-card');
        if (firstBtn) {
            firstBtn.classList.add('selected');
            dateInput.value = days[0].value;
            renderTimeSlots(days[0].value);
        }
    }

    // Time slots: 11:00 (11am) to 02:20 (2:20am next day)
    function getTimeSlots() {
        const slots = [];
        const startMinutes = 11 * 60; // 11 AM
        const endMinutes = 24 * 60 + 2 * 60 + 20;   // 2:20 AM next day

        function formatTime(totalMinutes) {
            let hours = Math.floor(totalMinutes / 60);
            let minutes = totalMinutes % 60;

            // Adjust hours for the next day to be 00, 01, 02 instead of 24, 25, 26
            if (hours >= 24) {
                hours -= 24;
            }

            const paddedHours = hours < 10 ? '0' + hours : '' + hours;
            const paddedMinutes = minutes < 10 ? '0' + minutes : '' + minutes;
            return `${paddedHours}:${paddedMinutes}`;
        }

        for (let currentMinutes = startMinutes; currentMinutes <= endMinutes; currentMinutes += 40) {
            slots.push(formatTime(currentMinutes));
        }
        return slots;
    }

    async function renderTimeSlots(dateValue) {
        timeSlotsContainer.innerHTML = '';
        if (!dateValue) return;

        const selectedHairstylist = hairstylistSelect.value;
        if (!selectedHairstylist) {
            showMessage('يرجى اختيار حلاق أولاً.', false);
            return;
        }
        
        let registrations = [];
        try {
            const response = await fetch(`${API_BASE_URL}/registrations`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            registrations = data.data || [];
        } catch (error) {
            console.error('Error fetching registrations for time slots:', error);
            showMessage('حدث خطأ أثناء تحميل المواعيد المتاحة.', false);
            return;
        }

        const slots = getTimeSlots();
        
        // For 00:00 and 01:00, check next day
        const d = new Date(dateValue);
        const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        slots.forEach(slot => {
            let isAvailable = true;
            let regDate = dateValue;
            // Correctly determine the date for slots that fall on the next day
            if (slot === '00:00' || slot === '00:40' || slot === '01:20' || slot === '02:00') {
                regDate = nextDayStr;
            }

            // Check for availability for the selected hairstylist
            if (registrations.some(r => r.date === regDate && r.time === slot && r.hairstylist === selectedHairstylist)) {
                isAvailable = false;
            }
            
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = slot;

            if (isAvailable) {
                btn.className = 'time-slot';
                btn.onclick = function() {
                    document.querySelectorAll('.time-slot.selected').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    timeInput.value = slot;
                };
            } else {
                btn.className = 'time-slot unavailable';
                btn.disabled = true;
            }
            timeSlotsContainer.appendChild(btn);
        });
        timeInput.value = '';
    }

    // Add event listener for hairstylist selection to re-render time slots
    hairstylistSelect.addEventListener('change', function() {
        renderTimeSlots(dateInput.value);
    });

    function clearMessages() {
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');
        successMessage.textContent = '';
        errorMessage.textContent = '';
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages(); // Clear previous messages

        const name = form.name.value.trim();
        const phone = form.phone.value.trim();
        const service = form.service.value;
        let date = form.date.value;
        const time = form.time.value;
        const hairstylist = form.hairstylist.value;

        if (!name || !phone || !service || !date || !time || !hairstylist) {
            showMessage('يرجى تعبئة جميع الحقول واختيار حلاق ووقت متاح.', false);
            return;
        }

        // If time is 00:00 or 01:00, registration should be for the next day
        if (time === '00:00' || time === '00:40' || time === '01:20' || time === '02:00') {
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            date = d.toISOString().split('T')[0];
        }

        try {
            const response = await fetch(`${API_BASE_URL}/registrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, phone, service, date, time, hairstylist }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle API errors (e.g., double booking)
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            // Show alert prompt for successful reservation
            alert('شكراً لك يا ' + name + '! تم حجز موعدك بنجاح.');

            // Show success message on page and redirect to home page after a short delay
            showMessage('شكراً لك يا ' + name + '! تم حجز موعدك بنجاح. سيتم تحويلك للصفحة الرئيسية...', true);
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            form.reset();
            renderDayPicker(); // Re-render day picker and time slots after successful booking
        } catch (error) {
            console.error('Error submitting registration:', error);
            showMessage('عذراً، حدث خطأ أثناء الحجز: ' + error.message, false);
        }
    });

    function showMessage(msg, success) {
        if (success) {
            successMessage.textContent = msg;
            successMessage.classList.add('show');
            errorMessage.classList.remove('show');
        } else {
            errorMessage.textContent = msg;
            errorMessage.classList.add('show');
            successMessage.classList.remove('show');
        }
    }

    // Initial renders
    populateServicesDropdown(); // Populate dropdown on load
    renderDayPicker();
}); 