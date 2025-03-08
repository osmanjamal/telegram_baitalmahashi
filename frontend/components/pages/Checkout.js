import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { renderOrderItem } from '../shared/OrderItem.js';
import { renderLocationPicker } from '../shared/LocationPicker.js';
import { renderPaymentMethods } from '../shared/PaymentMethod.js';
import { createOrder } from '../../js/api.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';
import { processPayment } from '../../js/payments.js';

// دالة عرض صفحة إتمام الطلب
export function renderCheckout(container) {
  // التحقق من وجود عناصر في السلة
  const { items, totalPrice } = store.getState().cart;
  if (items.length === 0) {
    router.navigate('/cart');
    return;
  }
  
  // التحقق من حالة المصادقة
  const { isAuthenticated } = store.getState().auth;
  if (!isAuthenticated) {
    // تخزين صفحة الإتمام كصفحة إعادة توجيه بعد تسجيل الدخول
    store.updateState('auth.redirectAfterLogin', '/checkout');
    router.navigate('/auth');
    return;
  }
  
  // عرض تخطيط الصفحة
  const contentContainer = renderMainLayout(container);
  
  // حساب القيم الإجمالية
  const taxRate = 0.15; // 15% ضريبة القيمة المضافة
  const subtotal = totalPrice;
  const tax = subtotal * taxRate;
  const initialDeliveryFee = 10; // قيمة افتراضية
  const total = subtotal + tax + initialDeliveryFee;
  
  // عرض محتوى الصفحة
  contentContainer.innerHTML = `
    <section class="checkout-page section-padding">
      <div class="container">
        <div class="section-header">
          <h1>إتمام الطلب</h1>
          <p>أكمل المعلومات التالية لإتمام طلبك</p>
        </div>
        
        <div class="checkout-container">
          <!-- نموذج الطلب -->
          <div class="checkout-main">
            <div class="checkout-step active" id="deliveryMethodStep">
              <div class="step-header">
                <span class="step-number">1</span>
                <h2>طريقة التوصيل</h2>
              </div>
              <div class="step-content">
                <div class="delivery-options">
                  <label class="delivery-option">
                    <input type="radio" name="deliveryMethod" value="delivery" checked>
                    <div class="option-content">
                      <div class="option-icon">
                        <i class="icon-delivery"></i>
                      </div>
                      <div class="option-details">
                        <h3>توصيل للمنزل</h3>
                        <p>توصيل إلى عنوانك المحدد</p>
                      </div>
                      <span class="delivery-fee">+10 ريال</span>
                    </div>
                  </label>
                  <label class="delivery-option">
                    <input type="radio" name="deliveryMethod" value="pickup">
                    <div class="option-content">
                      <div class="option-icon">
                        <i class="icon-store"></i>
                      </div>
                      <div class="option-details">
                        <h3>استلام من المطعم</h3>
                        <p>جاهز للاستلام خلال 20-30 دقيقة</p>
                      </div>
                      <span class="delivery-fee">مجاناً</span>
                    </div>
                  </label>
                </div>
                
                <div id="deliveryAddressContainer" class="address-container">
                  <h3>عنوان التوصيل</h3>
                  <div id="addressSelector">
                    <!-- هنا سيتم عرض العناوين المحفوظة -->
                    <div class="saved-addresses" id="savedAddresses">
                      <!-- سيتم تعبئتها بشكل ديناميكي -->
                    </div>
                    <button id="newAddressBtn" class="btn btn-outline">
                      <i class="icon-plus"></i> إضافة عنوان جديد
                    </button>
                  </div>
                  
                  <div id="locationPickerContainer" class="location-picker-wrapper" style="display: none;">
                    <!-- هنا سيتم عرض منتقي الموقع -->
                  </div>
                </div>
                
                <button id="continueToPaymentBtn" class="btn btn-primary continue-btn">
                  متابعة لطريقة الدفع
                </button>
              </div>
            </div>
            
            <div class="checkout-step" id="paymentMethodStep">
              <div class="step-header">
                <span class="step-number">2</span>
                <h2>طريقة الدفع</h2>
              </div>
              <div class="step-content">
                <div id="paymentMethodsContainer">
                  <!-- هنا سيتم عرض طرق الدفع -->
                </div>
                
                <div class="form-group">
                  <label for="orderNotes">ملاحظات إضافية (اختياري)</label>
                  <textarea id="orderNotes" class="form-control" rows="3" placeholder="أي تعليمات خاصة للطلب..."></textarea>
                </div>
                
                <div class="checkout-actions">
                  <button id="backToDeliveryBtn" class="btn btn-outline back-btn">
                    العودة لطريقة التوصيل
                  </button>
                  <button id="placeOrderBtn" class="btn btn-primary">
                    تأكيد الطلب
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- ملخص الطلب -->
          <div class="checkout-sidebar">
            <div class="order-summary">
              <h3>ملخص الطلب</h3>
              
              <div class="order-items">
                <!-- هنا سيتم عرض عناصر الطلب -->
              </div>
              
              <div class="summary-subtotal summary-row">
                <span>المجموع الفرعي:</span>
                <span id="subtotalAmount">${formatCurrency(subtotal)}</span>
              </div>
              
              <div class="summary-delivery summary-row">
                <span>رسوم التوصيل:</span>
                <span id="deliveryFeeAmount">${formatCurrency(initialDeliveryFee)}</span>
              </div>
              
              <div class="summary-tax summary-row">
                <span>الضريبة (15%):</span>
                <span id="taxAmount">${formatCurrency(tax)}</span>
              </div>
              
              <div class="summary-total summary-row">
                <span>الإجمالي:</span>
                <span id="totalAmount">${formatCurrency(total)}</span>
              </div>
            </div>
            
            <div class="checkout-security">
              <div class="security-icon">
                <i class="icon-lock"></i>
              </div>
              <p>جميع المعاملات آمنة ومشفرة</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  
  // عرض عناصر الطلب
  const orderItemsContainer = contentContainer.querySelector('.order-items');
  if (orderItemsContainer) {
    items.forEach(item => {
      renderOrderItem(orderItemsContainer, item, false);
    });
  }
  
  // عرض العناوين المحفوظة
  renderSavedAddresses();
  
  // عرض طرق الدفع
  const paymentMethodsContainer = contentContainer.querySelector('#paymentMethodsContainer');
  if (paymentMethodsContainer) {
    renderPaymentMethods(paymentMethodsContainer, handlePaymentMethodSelect, 'cash');
  }
  
  // إضافة معالجات الأحداث
  addEventListeners(contentContainer);
}

// إضافة معالجات الأحداث
function addEventListeners(container) {
  // خيارات طريقة التوصيل
  const deliveryOptions = container.querySelectorAll('input[name="deliveryMethod"]');
  const deliveryAddressContainer = container.querySelector('#deliveryAddressContainer');
  const deliveryFeeElement = container.querySelector('#deliveryFeeAmount');
  const totalElement = container.querySelector('#totalAmount');
  
  deliveryOptions.forEach(option => {
    option.addEventListener('change', () => {
      const deliveryMethod = option.value;
      
      // عرض/إخفاء قسم العنوان حسب طريقة التوصيل
      if (deliveryMethod === 'delivery') {
        deliveryAddressContainer.style.display = 'block';
        // تحديث رسوم التوصيل والإجمالي
        const { totalPrice } = store.getState().cart;
        const taxRate = 0.15;
        const deliveryFee = 10;
        const total = totalPrice + (totalPrice * taxRate) + deliveryFee;
        
        deliveryFeeElement.textContent = formatCurrency(deliveryFee);
        totalElement.textContent = formatCurrency(total);
      } else {
        deliveryAddressContainer.style.display = 'none';
        // تحديث رسوم التوصيل والإجمالي
        const { totalPrice } = store.getState().cart;
        const taxRate = 0.15;
        const deliveryFee = 0;
        const total = totalPrice + (totalPrice * taxRate) + deliveryFee;
        
        deliveryFeeElement.textContent = formatCurrency(deliveryFee);
        totalElement.textContent = formatCurrency(total);
      }
    });
  });
  
  // زر إضافة عنوان جديد
  const newAddressBtn = container.querySelector('#newAddressBtn');
  const locationPickerContainer = container.querySelector('#locationPickerContainer');
  const addressSelector = container.querySelector('#addressSelector');
  
  if (newAddressBtn && locationPickerContainer && addressSelector) {
    newAddressBtn.addEventListener('click', () => {
      // إخفاء منتقي العناوين وعرض منتقي الموقع
      addressSelector.style.display = 'none';
      locationPickerContainer.style.display = 'block';
      
      // عرض منتقي الموقع
      renderLocationPicker(locationPickerContainer, handleLocationSelected);
    });
  }
  
  // أزرار التنقل بين الخطوات
  const continueToPaymentBtn = container.querySelector('#continueToPaymentBtn');
  const backToDeliveryBtn = container.querySelector('#backToDeliveryBtn');
  const deliveryMethodStep = container.querySelector('#deliveryMethodStep');
  const paymentMethodStep = container.querySelector('#paymentMethodStep');
  
  if (continueToPaymentBtn && deliveryMethodStep && paymentMethodStep) {
    continueToPaymentBtn.addEventListener('click', () => {
      // التحقق من اختيار عنوان التوصيل إذا كانت طريقة التوصيل هي "توصيل"
      const deliveryMethod = container.querySelector('input[name="deliveryMethod"]:checked').value;
      
      if (deliveryMethod === 'delivery') {
        const selectedAddress = container.querySelector('input[name="savedAddress"]:checked');
        const isLocationPickerVisible = locationPickerContainer.style.display !== 'none';
        
        if (!selectedAddress && !isLocationPickerVisible) {
          showLocalNotification('تنبيه', 'يرجى اختيار عنوان للتوصيل أو إضافة عنوان جديد', 'warning');
          return;
        }
      }
      
      // الانتقال إلى خطوة طريقة الدفع
      deliveryMethodStep.classList.remove('active');
      paymentMethodStep.classList.add('active');
    });
  }
  
  if (backToDeliveryBtn && deliveryMethodStep && paymentMethodStep) {
    backToDeliveryBtn.addEventListener('click', () => {
      // الرجوع إلى خطوة طريقة التوصيل
      paymentMethodStep.classList.remove('active');
      deliveryMethodStep.classList.add('active');
    });
  }
  
  // زر تأكيد الطلب
  const placeOrderBtn = container.querySelector('#placeOrderBtn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', handlePlaceOrder);
  }
}

// عرض العناوين المحفوظة
function renderSavedAddresses() {
  const savedAddressesContainer = document.getElementById('savedAddresses');
  if (!savedAddressesContainer) return;
  
  // جلب العناوين المحفوظة من المخزن
  const { user } = store.getState().auth;
  const addresses = user?.addresses || [];
  
  if (addresses.length === 0) {
    savedAddressesContainer.innerHTML = `
      <div class="no-addresses">
        <p>لا توجد عناوين محفوظة.</p>
      </div>
    `;
  } else {
    savedAddressesContainer.innerHTML = addresses.map((address, index) => `
      <label class="saved-address">
        <input type="radio" name="savedAddress" value="${index}" ${index === 0 ? 'checked' : ''}>
        <div class="address-content">
          <h4>${address.label}</h4>
          <p>${address.address}</p>
          ${address.buildingNumber ? `<p>مبنى: ${address.buildingNumber}, شقة: ${address.apartmentNumber || '-'}</p>` : ''}
        </div>
      </label>
    `).join('');
  }
}

// معالجة اختيار الموقع
function handleLocationSelected(locationData) {
  // إخفاء منتقي الموقع وعرض منتقي العناوين
  const locationPickerContainer = document.getElementById('locationPickerContainer');
  const addressSelector = document.getElementById('addressSelector');
  
  if (locationPickerContainer && addressSelector) {
    locationPickerContainer.style.display = 'none';
    addressSelector.style.display = 'block';
  }
  
  // في تطبيق حقيقي، هنا سيتم حفظ العنوان الجديد في حساب المستخدم
  // ثم إعادة عرض العناوين المحفوظة
  
  // إظهار إشعار
  showLocalNotification('تم إضافة العنوان', 'تم إضافة العنوان الجديد بنجاح');
  
  // محاكاة إضافة العنوان
  const savedAddressesContainer = document.getElementById('savedAddresses');
  if (savedAddressesContainer) {
    const addressHtml = `
      <label class="saved-address">
        <input type="radio" name="savedAddress" value="new" checked>
        <div class="address-content">
          <h4>عنوان جديد</h4>
          <p>${locationData.address}</p>
          ${locationData.buildingNumber ? `<p>مبنى: ${locationData.buildingNumber}, شقة: ${locationData.apartmentNumber || '-'}</p>` : ''}
        </div>
      </label>
    `;
    
    // إضافة العنوان الجديد في بداية القائمة
    savedAddressesContainer.innerHTML = addressHtml + savedAddressesContainer.innerHTML;
  }
}

// معالجة اختيار طريقة الدفع
function handlePaymentMethodSelect(method) {
  // تخزين طريقة الدفع المختارة
  selectedPaymentMethod = method;
}

// متغير لتخزين طريقة الدفع المختارة
let selectedPaymentMethod = 'cash';

// معالجة إرسال الطلب
async function handlePlaceOrder() {
  try {
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري معالجة الطلب', 'يرجى الانتظار...');
    
    // جمع بيانات الطلب
    const deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const orderNotes = document.getElementById('orderNotes').value;
    
    // بيانات العنوان (إذا كانت طريقة التوصيل هي "توصيل")
    let deliveryAddress = null;
    if (deliveryMethod === 'delivery') {
      const selectedAddressRadio = document.querySelector('input[name="savedAddress"]:checked');
      
      if (selectedAddressRadio) {
        const addressIndex = selectedAddressRadio.value;
        
        if (addressIndex === 'new') {
          // العنوان الجديد (من منتقي الموقع)
          // في تطبيق حقيقي، سيتم استرجاع البيانات المحفوظة مؤقتاً
          deliveryAddress = {
            address: 'العنوان الجديد',
            coordinates: { lat: 24.7136, lng: 46.6753 },
            buildingNumber: '123',
            floorNumber: '1',
            apartmentNumber: '5'
          };
        } else {
          // عنوان محفوظ
          const { user } = store.getState().auth;
          deliveryAddress = user.addresses[parseInt(addressIndex)];
        }
      }
    }
    
    // جمع بيانات العناصر
    const { items, totalPrice } = store.getState().cart;
    const orderItems = items.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity,
      options: item.options,
      specialInstructions: item.specialInstructions
    }));
    
    // إنشاء كائن بيانات الطلب
    const orderData = {
      items: orderItems,
      deliveryMethod,
      deliveryAddress,
      paymentMethod: selectedPaymentMethod,
      specialInstructions: orderNotes
    };
    
    // إرسال الطلب
    const result = await createOrder(orderData);
    
    if (result.success) {
      // معالجة الدفع إذا كانت طريقة الدفع إلكترونية
      if (selectedPaymentMethod !== 'cash') {
        await processPayment(result.orderId, selectedPaymentMethod);
      }
      
      // إفراغ السلة
      store.clearCart();
      
      // التوجيه إلى صفحة تتبع الطلب
      router.navigate(`/order-tracking?orderId=${result.orderId}`);
    } else {
      showLocalNotification('خطأ', result.message || 'حدث خطأ أثناء إرسال الطلب', 'error');
    }
  } catch (error) {
    console.error('خطأ في إرسال الطلب:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
  }
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}