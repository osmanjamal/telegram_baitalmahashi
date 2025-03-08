import { store } from '../../js/store.js';

export function renderOrderItem(container, orderItem, isInCart = false, onQuantityChange, onRemove) {
  const { menuItem, quantity, options, price, totalPrice, specialInstructions } = orderItem;
  
  // إنشاء عنصر الطلب
  const itemElement = document.createElement('div');
  itemElement.className = 'order-item';
  
  // إذا كان العنصر موجودًا في السلة
  if (isInCart) {
    itemElement.innerHTML = `
      <div class="order-item-image">
        <img src="${menuItem.image || '/assets/images/ui/placeholder.png'}" alt="${menuItem.name}">
      </div>
      
      <div class="order-item-details">
        <h3 class="order-item-title">${menuItem.name}</h3>
        
        ${options && options.length > 0 ? `
          <div class="order-item-options">
            <ul>
              ${options.map(option => `
                <li>${option.name}: ${option.choice}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${specialInstructions ? `
          <div class="order-item-instructions">
            <p><i class="icon-info"></i> ${specialInstructions}</p>
          </div>
        ` : ''}
        
        <div class="order-item-price">
          <span>${formatCurrency(price)}</span>
        </div>
      </div>
      
      <div class="order-item-actions">
        <div class="quantity-control">
          <button type="button" class="quantity-btn minus-btn">-</button>
          <input type="number" class="quantity-input" value="${quantity}" min="1" max="10">
          <button type="button" class="quantity-btn plus-btn">+</button>
        </div>
        
        <div class="order-item-total">
          <span>${formatCurrency(totalPrice)}</span>
        </div>
        
        <button type="button" class="remove-item-btn">
          <i class="icon-trash"></i>
        </button>
      </div>
    `;
    
    // إضافة معالجات الأحداث
    const quantityInput = itemElement.querySelector('.quantity-input');
    const minusBtn = itemElement.querySelector('.minus-btn');
    const plusBtn = itemElement.querySelector('.plus-btn');
    const removeBtn = itemElement.querySelector('.remove-item-btn');
    
    // تغيير الكمية
    quantityInput.addEventListener('change', () => {
      const newQuantity = Math.max(1, Math.min(10, parseInt(quantityInput.value) || 1));
      quantityInput.value = newQuantity;
      
      if (onQuantityChange) {
        onQuantityChange(orderItem, newQuantity);
      }
    });
    
    // أزرار زيادة ونقصان الكمية
    minusBtn.addEventListener('click', () => {
      const newQuantity = Math.max(1, parseInt(quantityInput.value) - 1);
      quantityInput.value = newQuantity;
      
      if (onQuantityChange) {
        onQuantityChange(orderItem, newQuantity);
      }
    });
    
    plusBtn.addEventListener('click', () => {
      const newQuantity = Math.min(10, parseInt(quantityInput.value) + 1);
      quantityInput.value = newQuantity;
      
      if (onQuantityChange) {
        onQuantityChange(orderItem, newQuantity);
      }
    });
    
    // إزالة العنصر
    removeBtn.addEventListener('click', () => {
      if (onRemove) {
        onRemove(orderItem);
      }
    });
  } else {
    // إذا كان العنصر في مراجعة الطلب
    itemElement.innerHTML = `
      <div class="order-item-details">
        <div class="order-item-header">
          <h3 class="order-item-title">${menuItem.name}</h3>
          <div class="order-item-quantity">العدد: ${quantity}</div>
        </div>
        
        ${options && options.length > 0 ? `
          <div class="order-item-options">
            <ul>
              ${options.map(option => `
                <li>${option.name}: ${option.choice}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${specialInstructions ? `
          <div class="order-item-instructions">
            <p><i class="icon-info"></i> ${specialInstructions}</p>
          </div>
        ` : ''}
      </div>
      
      <div class="order-item-price">
        <span>${formatCurrency(totalPrice)}</span>
      </div>
    `;
  }
  
  // إضافة العنصر إلى الحاوية
  container.appendChild(itemElement);
}

// دالة لعرض ملخص الطلب
export function renderOrderSummary(container, order) {
  container.innerHTML = `
    <div class="order-summary">
      <h3>ملخص الطلب</h3>
      
      <div class="order-summary-items">
        ${order.items.map(item => `
          <div class="summary-item">
            <span class="item-name">
              ${item.quantity}x ${item.menuItem.name}
            </span>
            <span class="item-price">
              ${formatCurrency(item.totalPrice)}
            </span>
          </div>
        `).join('')}
      </div>
      
      <div class="summary-subtotal summary-row">
        <span>المجموع الفرعي</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      
      ${order.discount > 0 ? `
        <div class="summary-discount summary-row">
          <span>الخصم</span>
          <span>- ${formatCurrency(order.discount)}</span>
        </div>
      ` : ''}
      
      <div class="summary-tax summary-row">
        <span>الضريبة (${(order.taxRate * 100).toFixed(0)}%)</span>
        <span>${formatCurrency(order.tax)}</span>
      </div>
      
      ${order.deliveryFee > 0 ? `
        <div class="summary-delivery summary-row">
          <span>رسوم التوصيل</span>
          <span>${formatCurrency(order.deliveryFee)}</span>
        </div>
      ` : ''}
      
      <div class="summary-total summary-row">
        <span>الإجمالي</span>
        <span>${formatCurrency(order.total)}</span>
      </div>
    </div>
  `;
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}