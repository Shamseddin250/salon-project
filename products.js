document.addEventListener('DOMContentLoaded', async function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    const productsGrid = document.getElementById('productsGrid');

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
            productsGrid.innerHTML = '<p style="color: #e63946; text-align: center;">حدث خطأ أثناء تحميل المنتجات.</p>';
            return [];
        }
    }

    async function renderProducts() {
        const products = await fetchProducts();
        productsGrid.innerHTML = ''; // Clear existing content

        if (products.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; color: var(--primary-dark);">لا توجد منتجات لعرضها حالياً.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card card'; // Reusing card class for styling
            productCard.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/150/CCCCCC/888888?text=No+Image'}" alt="${product.name}" class="product-image">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${product.price} ليرة تركية</p>
            `;
            productsGrid.appendChild(productCard);
        });
    }

    renderProducts();
}); 