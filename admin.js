document.addEventListener('DOMContentLoaded', function() {
    const ADMIN_PASSWORD = '1234';
    const API_BASE_URL = 'http://localhost:3000/api';

    const loginForm = document.getElementById('adminLoginForm');
    const adminPanel = document.getElementById('adminPanel');
    const adminLogin = document.getElementById('adminLogin');
    const adminRegistrationTableContainer = document.getElementById('adminRegistrationTableContainer');
    const errorMessage = document.getElementById('errorMessage');

    const malekAdminWorkerStatusText = document.getElementById('malekAdminWorkerStatusText');
    const mohamedAdminWorkerStatusText = document.getElementById('mohamedAdminWorkerStatusText');
    const kawafirAdminWorkerStatusText = document.getElementById('kawafirAdminWorkerStatusText');

    const toggleMalekStatusBtn = document.getElementById('toggleMalekStatus');
    const toggleMohamedStatusBtn = document.getElementById('toggleMohamedStatus');
    const toggleKawafirStatusBtn = document.getElementById('toggleKawafirStatus');

    // Hairstylist names
    const HAIRSTYLISTS = ['مالك', 'محمد', 'كوافير'];

    // Helper function to show messages
    function showMessage(msg, isSuccess) {
        // For admin panel, we'll primarily use this for login errors or action feedback
        if (!isSuccess) {
            errorMessage.textContent = msg;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }, 3000);
        }
    }

    // Event Handlers for Save, Delete, Add (using Event Delegation)
    async function handleSaveClick(event) {
        const btn = event.target;
        const id = parseInt(btn.getAttribute('data-id'));
        const time = btn.getAttribute('data-time');
        const date = btn.getAttribute('data-date');
        const hairstylist = btn.getAttribute('data-hairstylist');

        const nameInput = document.querySelector(`.edit-name[data-id='${id}'][data-time='${time}'][data-date='${date}']`);
        const phoneInput = document.querySelector(`.edit-phone[data-id='${id}'][data-time='${time}'][data-date='${date}']`);
        const serviceInput = document.querySelector(`.edit-service[data-id='${id}'][data-time='${time}'][data-date='${date}']`);

        const name = nameInput ? nameInput.value : '';
        const phone = phoneInput ? phoneInput.value : '';
        const service = serviceInput ? serviceInput.value : '';

        // Find the correct container to re-render after save
        const containerId = `${hairstylist}AdminScheduleContainer`;
        const containerElement = document.getElementById(containerId);

        try {
            const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, phone, service, date, time, hairstylist }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update registration');
            }
            if (containerElement) {
                renderAdminScheduleTable(hairstylist, containerElement);
            }
        } catch (error) {
            console.error('Error updating registration:', error);
            showMessage('حدث خطأ أثناء تحديث الموعد: ' + error.message, false);
        }
    }

    async function handleDeleteClick(event) {
        const btn = event.target;
        const id = parseInt(btn.getAttribute('data-id'));
        const hairstylist = btn.getAttribute('data-hairstylist');

        // Find the correct container to re-render after delete
        const containerId = `${hairstylist}AdminScheduleContainer`;
        const containerElement = document.getElementById(containerId);

        if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
            try {
                const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete registration');
                }
                if (containerElement) {
                    renderAdminScheduleTable(hairstylist, containerElement);
                }
            } catch (error) {
                console.error('Error deleting registration:', error);
                showMessage('حدث خطأ أثناء حذف الموعد.', false);
            }
        }
    }

    async function handleAddClick(event) {
        const btn = event.target;
        const time = btn.getAttribute('data-time');
        const date = btn.getAttribute('data-date');
        const hairstylist = btn.getAttribute('data-hairstylist');

        // Prompt admin for customer details
        const name = prompt('أدخل اسم العميل:');
        if (!name) return; // Admin cancelled
        const phone = prompt('أدخل رقم هاتف العميل:');
        if (!phone) return; // Admin cancelled
        const service = prompt('أدخل الخدمة المطلوبة:');
        if (!service) return; // Admin cancelled

        // Find the correct container to re-render after add
        const containerId = `${hairstylist}AdminScheduleContainer`;
        const containerElement = document.getElementById(containerId);

        try {
            const response = await fetch(`${API_BASE_URL}/registrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, phone, date, time, hairstylist, service }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add registration');
            }
            if (containerElement) {
                renderAdminScheduleTable(hairstylist, containerElement);
            }
        } catch (error) {
            console.error('Error adding registration:', error);
            showMessage('حدث خطأ أثناء إضافة الموعد: ' + error.message, false);
        }
    }

    // Attach a single delegated event listener to the adminPanel
    adminPanel.addEventListener('click', function(event) {
        if (event.target.classList.contains('save-btn')) {
            handleSaveClick(event);
        } else if (event.target.classList.contains('delete-btn')) {
            handleDeleteClick(event);
        } else if (event.target.classList.contains('add-btn')) {
            handleAddClick(event);
        }
    });

    // Login logic
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        if (password === ADMIN_PASSWORD) {
            adminPanel.style.display = '';
            adminLogin.style.display = 'none';
            renderWorkerStatus('مالك', 'malekAdminWorkerStatusText');
            renderWorkerStatus('محمد', 'mohamedAdminWorkerStatusText');
            renderWorkerStatus('كوافير', 'kawafirAdminWorkerStatusText');
            // Render schedules for each hairstylist on admin login
            renderAdminScheduleTable('مالك', document.getElementById('malekAdminScheduleContainer'));
            renderAdminScheduleTable('محمد', document.getElementById('mohamedAdminScheduleContainer'));
            renderAdminScheduleTable('كوافير', document.getElementById('kawafirAdminScheduleContainer'));
            renderProductsAdminTable(); // Render products table on admin login
            errorMessage.style.display = 'none'; // Clear any previous error
        } else {
            showMessage('كلمة المرور غير صحيحة!', false);
        }
    });

    // Worker status logic
    async function renderWorkerStatus(hairstylistName, containerId) {
        const containerElement = document.getElementById(containerId);
        if (!containerElement) {
            console.error(`Container element with ID ${containerId} not found.`);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/workerStatus`);
            if (!response.ok) throw new Error('Failed to fetch worker status');
            const data = await response.json();
            const workerStatuses = data.data || [];
            const hairstylistStatus = workerStatuses.find(w => w.hairstylist === hairstylistName);
            const status = hairstylistStatus ? hairstylistStatus.status : 'out';
            containerElement.textContent = status === 'in' ? 'في الصالون' : 'خارج الصالون';
            containerElement.style.color = status === 'in' ? '#43aa8b' : '#e63946';
        } catch (error) {
            console.error('Error fetching worker status:', error);
            containerElement.textContent = 'غير متوفر';
            containerElement.style.color = '#e63946';
        }
    }

    // Event listeners for toggle buttons
    toggleMalekStatusBtn.addEventListener('click', () => toggleWorkerStatus('مالك', 'malekAdminWorkerStatusText'));
    toggleMohamedStatusBtn.addEventListener('click', () => toggleWorkerStatus('محمد', 'mohamedAdminWorkerStatusText'));
    toggleKawafirStatusBtn.addEventListener('click', () => toggleWorkerStatus('كوافير', 'kawafirAdminWorkerStatusText'));

    async function toggleWorkerStatus(hairstylistName, containerId) {
        const containerElement = document.getElementById(containerId);
        const currentStatusText = containerElement.textContent;
        const current = (currentStatusText === 'في الصالون') ? 'in' : 'out';
        const next = current === 'in' ? 'out' : 'in';

        try {
            const response = await fetch(`${API_BASE_URL}/workerStatus`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hairstylist: hairstylistName, status: next }),
            });
            if (!response.ok) throw new Error('Failed to update worker status');
            renderWorkerStatus(hairstylistName, containerId); // Re-render after successful update
        } catch (error) {
            console.error('Error updating worker status:', error);
            showMessage('حدث خطأ أثناء تغيير حالة الحلاق.', false);
        }
    }

    // Registration table logic
    async function renderAdminScheduleTable(hairstylistName, containerElement) {
        let registrations = [];
        try {
            const response = await fetch(`${API_BASE_URL}/registrations`);
            if (!response.ok) throw new Error('Failed to fetch registrations');
            const data = await response.json();
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

        let tableHtml = '<table class="reg-table"><thead><tr><th>الوقت</th><th>الاسم</th><th>رقم الهاتف</th><th>الخدمة</th><th>إجراء</th></tr></thead><tbody>';
        timeSlots.forEach(slot => {
            let reg, regDate;
            let targetDateStr = (slot === '00:00' || slot === '00:40' || slot === '01:20' || slot === '02:00') ? nextDayStr : todayStr;
            reg = registrations.find(r => r.date === targetDateStr && r.time === slot && r.hairstylist === hairstylistName);

            if (reg) {
                tableHtml += `<tr><td>${slot}</td><td><input type='text' value='${reg.name}' data-id='${reg.id}' data-time='${slot}' data-date='${targetDateStr}' class='edit-name'></td><td><input type='text' value='${reg.phone || ''}' data-id='${reg.id}' data-time='${slot}' data-date='${targetDateStr}' class='edit-phone'></td><td><input type='text' value='${reg.service || ''}' data-id='${reg.id}' data-time='${slot}' data-date='${targetDateStr}' class='edit-service'></td><td><button class='btn btn-small save-btn' data-id='${reg.id}' data-time='${slot}' data-date='${targetDateStr}' data-hairstylist='${hairstylistName}'>حفظ</button> <button class='btn btn-small delete-btn' data-id='${reg.id}' data-time='${slot}' data-date='${targetDateStr}' data-hairstylist='${hairstylistName}'>حذف</button></td></tr>`;
            } else {
                tableHtml += `<tr><td>${slot}</td><td>-</td><td>-</td><td>-</td><td><button class='btn btn-small add-btn' data-time='${slot}' data-date='${targetDateStr}' data-hairstylist='${hairstylistName}'>إضافة</button></td></tr>`;
            }
        });
        tableHtml += '</tbody></table>';
        containerElement.innerHTML = tableHtml;
    }

    // Product Management Logic
    const productForm = document.getElementById('productForm');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productImageUrlInput = document.getElementById('productImageUrl');
    const productIdInput = document.getElementById('productId');
    const clearProductFormBtn = document.getElementById('clearProductForm');
    const productsAdminTableContainer = document.getElementById('productsAdminTableContainer');

    const dropArea = document.getElementById('dropArea');
    const productImageInput = document.getElementById('productImageInput');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImage');

    let selectedProductFile = null; // To store the file object for upload

    // Drag and Drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFile(files[0]);
    }

    // Click to select file
    dropArea.addEventListener('click', () => productImageInput.click());
    productImageInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Handle file processing (preview and storage)
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showMessage('الرجاء اختيار ملف صورة صالح.', false);
            return;
        }

        selectedProductFile = file;
        const reader = new FileReader();

        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            removeImageBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
        showMessage('', true); // Clear previous messages
    }

    // Remove image
    removeImageBtn.addEventListener('click', function() {
        selectedProductFile = null;
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
        removeImageBtn.style.display = 'none';
        productImageInput.value = ''; // Clear the file input
    });

    async function fetchProducts() {
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            showMessage('حدث خطأ أثناء تحميل المنتجات.', false);
            return [];
        }
    }

    async function renderProductsAdminTable() {
        const products = await fetchProducts();
        productsAdminTableContainer.innerHTML = '';

        if (products.length === 0) {
            productsAdminTableContainer.innerHTML = '<p>لا توجد منتجات حالياً. استخدم النموذج أعلاه لإضافة منتج جديد.</p>';
            return;
        }

        let tableHtml = '<table class="reg-table"><thead><tr><th>الاسم</th><th>السعر (ليرة تركية)</th><th>الصورة</th><th>إجراءات</th></tr></thead><tbody>';
        products.forEach(product => {
            tableHtml += `
                <tr>
                    <td><input type="text" class="edit-product-name" value="${product.name}" data-id="${product.id}"></td>
                    <td><input type="number" class="edit-product-price" value="${product.price}" data-id="${product.id}"></td>
                    <td>
                        <img src="${product.imageUrl || 'https://via.placeholder.com/50/CCCCCC/888888?text=N/A'}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                        <input type="hidden" class="existing-image-url" value="${product.imageUrl || ''}" data-id="${product.id}">
                        <input type="file" class="edit-product-image-file" accept="image/*" data-id="${product.id}" style="display:none;">
                        <button type="button" class="btn btn-small edit-image-btn" data-id="${product.id}">تغيير الصورة</button>
                    </td>
                    <td>
                        <button class="btn btn-small save-product-btn" data-id="${product.id}">حفظ</button>
                        <button class="btn btn-small btn-secondary delete-product-btn" data-id="${product.id}">حذف</button>
                    </td>
                </tr>
            `;
        });
        tableHtml += '</tbody></table>';
        productsAdminTableContainer.innerHTML = tableHtml;
    }

    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);
        // productImageUrlInput is now file input, so its value is not used directly for URL
        // const imageUrl = productImageUrlInput.value.trim(); 
        const id = productIdInput.value;

        if (!name || isNaN(price) || price < 0) {
            showMessage('يرجى إدخال اسم المنتج وسعر صحيح.', false);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        if (selectedProductFile) {
            formData.append('productImage', selectedProductFile);
        } else if (id) {
            // For update, if no new file is selected, retain existing imageUrl
            // This assumes that on update, if productImageInput.files is empty, we keep the old URL.
            // We need to pass the existing image URL if we are updating and not uploading a new file.
            // The backend is set up to handle this by checking req.body.imageUrl
            const existingImageUrl = document.querySelector(`.existing-image-url[data-id='${id}']`);
            if (existingImageUrl) {
                formData.append('imageUrl', existingImageUrl.value);
            }
        }

        let response;

        try {
            if (id) {
                // Update existing product
                response = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'PUT',
                    body: formData // Use FormData for file upload
                });
            } else {
                // Add new product
                response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    body: formData // Use FormData for file upload
                });
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'فشل في حفظ المنتج.');
            }

            showMessage('تم حفظ المنتج بنجاح!', true);
            productForm.reset();
            productIdInput.value = ''; // Clear hidden ID
            removeImageBtn.click(); // Reset image preview
            selectedProductFile = null; // Clear selected file
            renderProductsAdminTable();
        } catch (error) {
            console.error('Error saving product:', error);
            showMessage('حدث خطأ أثناء حفظ المنتج: ' + error.message, false);
        }
    });

    clearProductFormBtn.addEventListener('click', function() {
        productForm.reset();
        productIdInput.value = '';
        removeImageBtn.click(); // Reset image preview
        selectedProductFile = null; // Clear selected file
        showMessage('', true); // Clear any messages
    });

    // Event delegation for product table actions (edit, delete)
    productsAdminTableContainer.addEventListener('click', async function(event) {
        if (event.target.classList.contains('save-product-btn')) {
            const id = event.target.getAttribute('data-id');
            const row = event.target.closest('tr');
            const name = row.querySelector('.edit-product-name').value.trim();
            const price = parseFloat(row.querySelector('.edit-product-price').value);
            
            // For image, check if a new file was selected in this row's file input
            const fileInput = row.querySelector('.edit-product-image-file');
            let newImageFile = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
            const existingImageUrl = row.querySelector('.existing-image-url').value; // Get existing URL

            // Determine the imageUrl to send to backend
            let imageUrlToSend = existingImageUrl; // Default to existing
            if (newImageFile) {
                // If a new file is selected, the backend will handle it.
                // We send it as a FormData object. No need to set imageUrlToSend here.
            }

            if (!name || isNaN(price) || price < 0) {
                showMessage('يرجى إدخال اسم المنتج وسعر صحيح.', false);
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', price);
            if (newImageFile) {
                formData.append('productImage', newImageFile);
            } else {
                formData.append('imageUrl', existingImageUrl); // Send existing URL if no new file
            }

            try {
                const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'PUT',
                    body: formData // Use FormData for file upload
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل في تحديث المنتج.');
                }
                showMessage('تم تحديث المنتج بنجاح!', true);
                renderProductsAdminTable();
            } catch (error) {
                console.error('Error updating product:', error);
                showMessage('حدث خطأ أثناء تحديث المنتج: ' + error.message, false);
            }
        } else if (event.target.classList.contains('delete-product-btn')) {
            const id = event.target.getAttribute('data-id');
            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'فشل في حذف المنتج.');
                    }
                    showMessage('تم حذف المنتج بنجاح!', true);
                    renderProductsAdminTable();
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showMessage('حدث خطأ أثناء حذف المنتج: ' + error.message, false);
                }
            }
        } else if (event.target.classList.contains('edit-image-btn')) {
            const id = event.target.getAttribute('data-id');
            const fileInput = document.querySelector(`.edit-product-image-file[data-id='${id}']`);
            if (fileInput) {
                fileInput.click(); // Trigger file input click
            }
        }
    });
});
