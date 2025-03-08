import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { renderOrderItem } from '../shared/OrderItem.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';

// دالة عرض صفحة سلة المشتريات
export function renderCart(container) {
  // عرض تخطيط الصفحة
  const contentContainer = renderMainLayout(container);
  
  // جلب بيانات السلة من المخزن
  const { items, totalPrice } = store.getState().cart;
  
  // التحقق من حالة المصادقة
  const { isAuthenticated } = store.getState().auth;
  
  // عرض محتوى الصفحة
  if (items.length === 0) {
    // سلة فارغة
    contentContainer.innerHTML = `
      <section class="cart-page section-padding">
        <div class="container">
          <div class="section-header">
            <h1>سلة المشتريات</h1>
          </div>
          
          <div class="empty-cart">
            <div class="empty-cart-icon">
              <i class="icon-cart-empty"></i>
            </div>
            <h2>سلة المشتريات فارغة</h2>
            <p>أضف بعض العناصر اللذيذة إلى سلتك لإتمام الطلب</p>
            <a href="/menu" class="btn btn-primary" data-nav>تصفح القائمة</a>
          </div>
        </div>
      </section>
    `;
  } else {
    // سلة بها عناصر
    contentContainer.innerHTML = `
      <section class="cart-page section-padding">
        <div class="container">
          <div class="section-header">
            <h1>سلة المشتريات</h1>
            <p>مراجعة العناصر في سلة المشتريات الخاصة بك</p>
          </div>
          
          <div class="cart-container">
            <div class="cart-items" id="cartItems">
              <!-- هنا سيتم عرض عناصر السلة -->
            </div>
            
            <div class="cart-sidebar">
              <div class="cart-summary">
                <h3>ملخص الطلب</h3>
                
                <div class="summary-row">
                  <span>عدد العناصر:</span>
                  <span>${getCartItemsCount(items)}</span>
                </div>
                
                <div class="summary-row">
                  <span>المجموع الفرعي:</span>
                  <span>${formatCurrency(totalPrice)}</span>
                </div>
                
                <div class="summary-row">
                  <span>الضريبة (15%):</span>
                  <span>${formatCurrency(totalPrice * 0.15)}</span>
                </div>
                
                <div class="summary-row promo-code-row">
                  <div class="promo-code-input">
                    <input type="text" id="promoCode" placeholder="كود الخصم">
                    <button id="applyPromoBtn">تطبيق</button>
                  </div>
                </div>
                
                <div class="summary-total summary-row">
                  <span>الإجمالي:</span>
                  <span>${formatCurrency(totalPrice * 1.15)}</span>
                </div>
                
                ${isAuthenticated ? `
                  <button id="checkoutBtn" class="btn btn-primary btn-block">
                    إتمام الطلب
                  </button>
                ` : `
                  <a href="/auth?redirect=checkout" class="btn btn-primary btn-block" data-nav>
                    تسجيل الدخول لإتمام الطلب
                  </a>
                `}
                
                <a href="/menu" class="btn btn-outline btn-block" data-nav>
                  مواصلة التسوق
                </a>
                
                <button id="clearCartBtn" class="clear-cart-btn">
                  <i class="icon-trash"></i> إفراغ السلة
                </button>
              </div>
              
              <div class="delivery-info">
                <div class="delivery-icon">
                  <i class="icon-delivery"></i>
                </div>
                <div class="delivery-text">
                  <h4>التوصيل السريع</h4>
                  <p>نوصل طلبك خلال 30 دقيقة أو أقل</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    
    // عرض عناصر السلة
    const cartItemsContainer = contentContainer.querySelector('#cartItems');
    if (cartItemsContainer) {
      items.forEach(item => {
        renderOrderItem(cartItemsContainer, item, true, handleQuantityChange, handleRemoveItem);
      });
    }
    
    // إضافة معالجات الأحداث
    addEventListeners(contentContainer);
  }
}

// إضافة معالجات الأحداث
function addEventListeners(container) {
  // زر إتمام الطلب
  const checkoutBtn = container.querySelector('#checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      router.navigate('/checkout');
    });
  }
  
  // زر تطبيق كود الخصم
  const applyPromoBtn = container.querySelector('#applyPromoBtn');
  const promoCodeInput = container.querySelector('#promoCode');
  if (applyPromoBtn && promoCodeInput) {
    applyPromoBtn.addEventListener('click', () => {
      const promoCode = promoCodeInput.value.trim();
      if (promoCode) {
        // في تطبيق حقيقي، هنا سيتم التحقق من صحة الكود وتطبيق الخصم
        // هنا نقوم بمحاكاة نجاح/فشل العملية
        
        if (promoCode === 'FAMILY15') {
          showLocalNotification('تم تطبيق الخصم', 'تم تطبيق خصم 15% على طلبك');
          
          // في تطبيق حقيقي، هنا سيتم تحديث المخزن بقيمة الخصم
          // ثم تحديث واجهة المستخدم
          
          // إعادة تحميل الصفحة لتطبيق التغييرات
          setTimeout(() => {
            router.navigate('/cart');
          }, 500);
        } else {
          showLocalNotification('خطأ', 'كود الخصم غير صالح', 'error');
        }
      }
    });
  }
  
  // زر إفراغ السلة
  const clearCartBtn = container.querySelector('#clearCartBtn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      // تأكيد إفراغ السلة
      if (confirm('هل أنت متأكد من رغبتك في إفراغ سلة المشتريات؟')) {
        store.clearCart();
        showLocalNotification('تم إفراغ السلة', 'تم إفراغ سلة المشتريات بنجاح');
        router.navigate('/cart');
      }
    });
  }
}

// معالجة تغيير كمية العنصر
function handleQuantityChange(item, newQuantity) {
  store.updateCartItemQuantity(item.id, item.options, newQuantity);
  // إعادة تحميل الصفحة لتحديث المحتوى
  router.navigate('/cart');
}

// معالجة إزالة العنصر
function handleRemoveItem(item) {
  store.removeFromCart(item.id, item.options);
  showLocalNotification('تمت الإزالة', 'تمت إزالة العنصر من سلة المشتريات');
  // إعادة تحميل الصفحة لتحديث المحتوى
  router.navigate('/cart');
}

// الحصول على عدد العناصر في السلة
function getCartItemsCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0);
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}