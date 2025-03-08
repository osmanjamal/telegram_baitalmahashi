import { store } from '../../js/store.js';
import { showLocalNotification } from '../../js/notifications.js';

export function renderMenuCard(container, menuItem, addToCartCallback) {
  const card = document.createElement('div');
  card.className = 'menu-card';
  
  // جلب المعلومات الأساسية
  const { _id, name, description, price, image, category, options, available, spicyLevel } = menuItem;
  
  // إعداد النموذج
  card.innerHTML = `
    <div class="menu-card-image">
      <img src="${image || '/assets/images/ui/placeholder.png'}" alt="${name}" loading="lazy">
      ${!available ? '<div class="not-available-badge">غير متوفر</div>' : ''}
      ${category ? `<div class="category-badge">${category.name || ''}</div>` : ''}
    </div>
    
    <div class="menu-card-content">
      <div class="menu-card-header">
        <h3 class="menu-card-title">${name}</h3>
        <div class="menu-card-price">${formatCurrency(price)}</div>
      </div>
      
      <p class="menu-card-description">${description}</p>
      
      ${spicyLevel > 0 ? `
        <div class="spicy-level">
          ${'🌶️'.repeat(spicyLevel)}
        </div>
      ` : ''}
      
      <div class="menu-card-actions">
        ${available ? `
          <button class="btn btn-primary add-to-cart-btn" data-id="${_id}">
            <i class="icon-cart"></i> أضف للسلة
          </button>
          <button class="btn btn-outline view-details-btn" data-id="${_id}">
            التفاصيل
          </button>
        ` : `
          <button class="btn btn-outline disabled">
            غير متوفر
          </button>
        `}
      </div>
    </div>
  `;
  
  // إضافة معالج حدث للنقر على زر الإضافة للسلة
  if (available) {
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
      handleAddToCart(menuItem, addToCartCallback);
    });
    
    // إضافة معالج حدث للنقر على زر التفاصيل
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', () => {
      showItemDetails(menuItem);
    });
  }
  
  // إضافة البطاقة إلى الحاوية
  container.appendChild(card);
}

// معالجة إضافة عنصر إلى السلة
function handleAddToCart(menuItem, callback) {
  // إذا كان العنصر ليس لديه خيارات، أضفه مباشرة للسلة
  if (!menuItem.options || menuItem.options.length === 0) {
    addItemToCart(menuItem);
    if (typeof callback === 'function') {
      callback(menuItem);
    }
    return;
  }
  
  // إذا كان العنصر له خيارات، اعرض نموذج الخيارات
  showOptionsModal(menuItem, callback);
}

// إضافة عنصر إلى السلة
function addItemToCart(menuItem, selectedOptions = [], quantity = 1) {
  const item = {
    id: menuItem._id,
    name: menuItem.name,
    price: menuItem.price,
    image: menuItem.image,
    options: selectedOptions,
    quantity
  };
  
  store.addToCart(item);
  
  showLocalNotification(
    'تمت الإضافة للسلة',
    `تمت إضافة ${menuItem.name} إلى سلة المشتريات`
  );
}

// عرض نموذج الخيارات
function showOptionsModal(menuItem, callback) {
  // إنشاء النموذج
  const modal = document.createElement('div');
  modal.className = 'modal options-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>اختر الخيارات</h3>
        <button type="button" class="close-modal">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="item-info">
          <h4>${menuItem.name}</h4>
          <p>${menuItem.description}</p>
        </div>
        
        <form id="optionsForm">
          ${menuItem.options.map((option, optionIndex) => `
            <div class="form-group">
              <label${option.required ? ' class="required"' : ''}>${option.name}</label>
              
              ${option.multiSelect ? `
                <div class="checkbox-group">
                  ${option.choices.map((choice, choiceIndex) => `
                    <div class="checkbox-item">
                      <input type="checkbox" 
                        id="option_${optionIndex}_${choiceIndex}" 
                        name="option_${optionIndex}" 
                        value="${choice.name}"
                        data-price="${choice.price || 0}">
                      <label for="option_${optionIndex}_${choiceIndex}">
                        ${choice.name}
                        ${choice.price ? ` (${formatCurrency(choice.price)})` : ''}
                      </label>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="radio-group">
                  ${option.choices.map((choice, choiceIndex) => `
                    <div class="radio-item">
                      <input type="radio" 
                        id="option_${optionIndex}_${choiceIndex}" 
                        name="option_${optionIndex}" 
                        value="${choice.name}"
                        data-price="${choice.price || 0}"
                        ${option.required && choiceIndex === 0 ? 'checked' : ''}>
                      <label for="option_${optionIndex}_${choiceIndex}">
                        ${choice.name}
                        ${choice.price ? ` (${formatCurrency(choice.price)})` : ''}
                      </label>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          `).join('')}
          
          <div class="form-group">
            <label for="specialInstructions">تعليمات خاصة (اختياري)</label>
            <textarea id="specialInstructions" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="quantity-control">
            <label>الكمية:</label>
            <div class="quantity-buttons">
              <button type="button" class="quantity-btn minus-btn">-</button>
              <input type="number" class="quantity-input" value="1" min="1" max="10">
              <button type="button" class="quantity-btn plus-btn">+</button>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" id="cancelOptionsBtn">إلغاء</button>
        <button type="button" class="btn btn-primary" id="addToCartWithOptionsBtn">
          إضافة للسلة (${formatCurrency(menuItem.price)})
        </button>
      </div>
    </div>
  `;
  
  // إضافة النموذج إلى الصفحة
  document.body.appendChild(modal);
  
  // إضافة معالجات الأحداث
  const closeModalBtn = modal.querySelector('.close-modal');
  const cancelBtn = modal.querySelector('#cancelOptionsBtn');
  const addToCartBtn = modal.querySelector('#addToCartWithOptionsBtn');
  const form = modal.querySelector('#optionsForm');
  const quantityInput = modal.querySelector('.quantity-input');
  const minusBtn = modal.querySelector('.minus-btn');
  const plusBtn = modal.querySelector('.plus-btn');
  
  // تحديث السعر الإجمالي
  const updateTotalPrice = () => {
    let totalPrice = menuItem.price;
    
    // إضافة أسعار الخيارات المحددة
    form.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
      totalPrice += parseFloat(input.getAttribute('data-price') || 0);
    });
    
    // ضرب السعر في الكمية
    totalPrice *= parseInt(quantityInput.value);
    
    // تحديث نص الزر
    addToCartBtn.textContent = `إضافة للسلة (${formatCurrency(totalPrice)})`;
  };
  
  // عند تغيير الخيارات
  form.addEventListener('change', updateTotalPrice);
  
  // عند تغيير الكمية
  quantityInput.addEventListener('change', () => {
    quantityInput.value = Math.max(1, Math.min(10, parseInt(quantityInput.value) || 1));
    updateTotalPrice();
  });
  
  // أزرار زيادة ونقصان الكمية
  minusBtn.addEventListener('click', () => {
    quantityInput.value = Math.max(1, parseInt(quantityInput.value) - 1);
    updateTotalPrice();
  });
  
  plusBtn.addEventListener('click', () => {
    quantityInput.value = Math.min(10, parseInt(quantityInput.value) + 1);
    updateTotalPrice();
  });
  
  // إغلاق النموذج
  const closeModal = () => {
    modal.remove();
  };
  
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // إضافة للسلة مع الخيارات
  addToCartBtn.addEventListener('click', () => {
    const selectedOptions = [];
    
    // جمع الخيارات المحددة
    menuItem.options.forEach((option, optionIndex) => {
      if (option.multiSelect) {
        // خيارات متعددة (checkboxes)
        const selectedChoices = Array.from(form.querySelectorAll(`input[name="option_${optionIndex}"]:checked`)).map(input => {
          return {
            name: option.name,
            choice: input.value,
            price: parseFloat(input.getAttribute('data-price') || 0)
          };
        });
        selectedOptions.push(...selectedChoices);
      } else {
        // خيار واحد (radio)
        const selectedInput = form.querySelector(`input[name="option_${optionIndex}"]:checked`);
        if (selectedInput) {
          selectedOptions.push({
            name: option.name,
            choice: selectedInput.value,
            price: parseFloat(selectedInput.getAttribute('data-price') || 0)
          });
        }
      }
    });
    
    // الحصول على الكمية
    const quantity = parseInt(quantityInput.value);
    
    // الحصول على التعليمات الخاصة
    const specialInstructions = form.querySelector('#specialInstructions').value;
    
    // إضافة العنصر للسلة
    const itemWithOptions = {
      ...menuItem,
      specialInstructions
    };
    
    addItemToCart(itemWithOptions, selectedOptions, quantity);
    
    if (typeof callback === 'function') {
      callback(itemWithOptions, selectedOptions, quantity);
    }
    
    // إغلاق النموذج
    closeModal();
  });
  
  // إظهار النموذج
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// عرض تفاصيل العنصر
function showItemDetails(menuItem) {
  // إنشاء النموذج
  const modal = document.createElement('div');
  modal.className = 'modal details-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${menuItem.name}</h3>
        <button type="button" class="close-modal">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="item-details">
          <div class="item-image">
            <img src="${menuItem.image || '/assets/images/ui/placeholder.png'}" alt="${menuItem.name}">
          </div>
          
          <div class="item-info">
            <p class="item-description">${menuItem.description}</p>
            
            ${menuItem.spicyLevel > 0 ? `
              <div class="spicy-level">
                <span>مستوى الحرارة:</span>
                ${'🌶️'.repeat(menuItem.spicyLevel)}
              </div>
            ` : ''}
            
            ${menuItem.nutritionalInfo ? `
              <div class="nutritional-info">
                <h4>المعلومات الغذائية</h4>
                <ul>
                  <li><strong>السعرات الحرارية:</strong> ${menuItem.nutritionalInfo.calories} سعرة</li>
                  <li><strong>البروتين:</strong> ${menuItem.nutritionalInfo.protein} جرام</li>
                  <li><strong>الكربوهيدرات:</strong> ${menuItem.nutritionalInfo.carbs} جرام</li>
                  <li><strong>الدهون:</strong> ${menuItem.nutritionalInfo.fat} جرام</li>
                </ul>
              </div>
            ` : ''}
            
            ${menuItem.ingredients ? `
              <div class="ingredients">
                <h4>المكونات</h4>
                <p>${menuItem.ingredients.join('، ')}</p>
              </div>
            ` : ''}
            
            ${menuItem.allergens ? `
              <div class="allergens">
                <h4>مسببات الحساسية</h4>
                <p>${menuItem.allergens.join('، ')}</p>
              </div>
            ` : ''}
            
            <div class="price-info">
              <h4>السعر</h4>
              <p class="price">${formatCurrency(menuItem.price)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" id="closeDetailsBtn">إغلاق</button>
        ${menuItem.available ? `
          <button type="button" class="btn btn-primary" id="addToCartFromDetailsBtn">
            <i class="icon-cart"></i> أضف للسلة
          </button>
        ` : `
          <button type="button" class="btn btn-outline disabled">
            غير متوفر
          </button>
        `}
      </div>
    </div>
  `;
  
  // إضافة النموذج إلى الصفحة
  document.body.appendChild(modal);
  
  // إضافة معالجات الأحداث
  const closeModalBtn = modal.querySelector('.close-modal');
  const closeDetailsBtn = modal.querySelector('#closeDetailsBtn');
  const addToCartBtn = modal.querySelector('#addToCartFromDetailsBtn');
  
  // إغلاق النموذج
  const closeModal = () => {
    modal.remove();
  };
  
  closeModalBtn.addEventListener('click', closeModal);
  closeDetailsBtn.addEventListener('click', closeModal);
  
  // إضافة للسلة
  if (menuItem.available && addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      closeModal();
      handleAddToCart(menuItem);
    });
  }
  
  // إظهار النموذج
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// دالة لتنسيق المبلغ كعملة
// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }