document.addEventListener('DOMContentLoaded', function() {
    // Base URL for your backend API
    const API_BASE_URL = 'http://localhost:3000/api';

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
                { name: 'حلاقة شعر', price: 300 },
                { name: 'حلاقة شعر وذقن', price: 600 },
                { name: 'تسريح شعر', price: 150 }
            ];
        }
    }

    // Worker status
    async function renderWorkerStatus(hairstylistName, containerId) {
        const containerElement = document.getElementById(containerId);
        if (!containerElement) {
            console.error(`Container element with ID ${containerId} not found.`);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/workerStatus`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const workerStatuses = data.data || [];
            const hairstylistStatus = workerStatuses.find(w => w.hairstylist === hairstylistName);
            const status = hairstylistStatus ? hairstylistStatus.status : 'out'; // Default to 'out'

            containerElement.textContent = status === 'in' ? 'في الصالون' : 'خارج الصالون';
            containerElement.style.color = status === 'in' ? '#43aa8b' : '#e63946';
        } catch (error) {
            console.error(`Error fetching worker status for ${hairstylistName}:`, error);
            containerElement.textContent = 'غير متوفر'; // Show an error state
            containerElement.style.color = '#e63946';
        }
    }

    // Hairstylist names
    const HAIRSTYLISTS = ['مالك', 'محمد', 'كوافير'];

    // Render individual schedule tables for each hairstylist
    async function renderScheduleTable(hairstylistName, containerElement) {
        let registrations = [];
        try {
            const response = await fetch(`${API_BASE_URL}/registrations`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Filter registrations for the specific hairstylist
            registrations = data.data.filter(reg => reg.hairstylist === hairstylistName) || [];
        } catch (error) {
            console.error(`Error fetching registrations for ${hairstylistName}:`, error);
            containerElement.innerHTML = '<p style="color: #e63946;">حدث خطأ أثناء تحميل جدول المواعيد.</p>';
            return;
        }

        const timeSlots = [];
        const startMinutes = 11 * 60; // 11 AM
        const endMinutes = 24 * 60 + 2 * 60 + 20;   // 2:20 AM next day

        function formatTime(totalMinutes) {
            let hours = Math.floor(totalMinutes / 60);
            let minutes = totalMinutes % 60;

            if (hours >= 24) {
                hours -= 24;
            }

            const paddedHours = hours < 10 ? '0' + hours : '' + hours;
            const paddedMinutes = minutes < 10 ? '0' + minutes : '' + minutes;
            return `${paddedHours}:${paddedMinutes}`;
        }

        for (let currentMinutes = startMinutes; currentMinutes <= endMinutes; currentMinutes += 40) {
            timeSlots.push(formatTime(currentMinutes));
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const nextDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const nextDayStr = nextDay.toISOString().split('T')[0];

        let tableHtml = '<table class="reg-table"><thead><tr><th>الوقت</th><th>الحالة</th></tr></thead><tbody>';
        timeSlots.forEach(slot => {
            let reg;
            let targetDateStr = (slot === '00:00' || slot === '00:40' || slot === '01:20' || slot === '02:00') ? nextDayStr : todayStr;
            reg = registrations.find(r => r.date === targetDateStr && r.time === slot && r.hairstylist === hairstylistName);

            if (reg) {
                tableHtml += `<tr><td>${slot}</td><td class="closed">محجوز</td></tr>`;
            } else {
                tableHtml += `<tr><td>${slot}</td><td class="open">متاح</td></tr>`;
            }
        });
        tableHtml += '</tbody></table>';
        containerElement.innerHTML = tableHtml;
    }

    // Initial render for worker status and schedules on page load
    renderWorkerStatus('مالك', 'malekWorkerStatusText');
    renderWorkerStatus('محمد', 'mohamedWorkerStatusText');
    renderWorkerStatus('كوافير', 'kawafirWorkerStatusText');
    renderScheduleTable('مالك', document.getElementById('malekScheduleContainer'));
    renderScheduleTable('محمد', document.getElementById('mohamedScheduleContainer'));
    renderScheduleTable('كوافير', document.getElementById('kawafirScheduleContainer'));
}); 