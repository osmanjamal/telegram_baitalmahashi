import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { getOrderById } from '../../js/api.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';

// دالة عرض صفحة تتبع الطلب
export async function renderOrderTracking(container) {
  // عرض تخطيط الصفحة مع شاشة تحميل
  const contentContainer = renderMainLayout(container, '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>');
  
  // الحصول على معرف الطلب من عنوان URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  
  if (!orderId) {
    contentContainer.innerHTML = `
      <section class="order-tracking-page section-padding">
        <div class="container">
          <div class="section-header">
            <h1>تتبع الطلب</h1>
          </div>
          
          <div class="error-container">
            <i class="icon-error"></i>
            <h3>رقم الطلب غير موجود</h3>
            <p>يرجى التحقق من الرابط أو الانتقال إلى قائمة طلباتك</p>
            <a href="/profile/orders" class="btn btn-primary" data-nav>طلباتي</a>
          </div>
        </div>
      </section>
    `;
    return;
  }
  
  try {
    // جلب بيانات الطلب
    const order = await getOrderById(orderId);
    
    // عرض معلومات تتبع الطلب
    renderOrderTrackingContent(contentContainer, order);
    
    // إضافة معالجات الأحداث
    addEventListeners(contentContainer, order);
    
    // بدء التحديث الدوري للطلب إذا كان نشطاً
    if (['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status)) {
      startOrderStatusPolling(contentContainer, orderId);
    }
  } catch (error) {
    console.error('خطأ في جلب بيانات الطلب:', error);
    contentContainer.innerHTML = `
      <section class="order-tracking-page section-padding">
        <div class="container">
          <div class="section-header">
            <h1>تتبع الطلب</h1>
          </div>
          
          <div class="error-container">
            <i class="icon-error"></i>
            <h3>خطأ في تحميل بيانات الطلب</h3>
            <p>حدث خطأ أثناء محاولة جلب بيانات الطلب. يرجى المحاولة مرة أخرى.</p>
            <button id="retryBtn" class="btn btn-primary">إعادة المحاولة</button>
          </div>
        </div>
      </section>
    `;
    
    // إضافة معالج حدث لزر إعادة المحاولة
    const retryBtn = contentContainer.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        renderOrderTracking(container);
      });
    }
  }
}

// عرض محتوى تتبع الطلب
function renderOrderTrackingContent(container, order) {
  // تحديد رسالة الحالة
  const statusMessages = {
    'pending': 'تم استلام طلبك وهو قيد المراجعة',
    'confirmed': 'تم تأكيد طلبك وسيبدأ تحضيره قريباً',
    'preparing': 'جاري تحضير طلبك',
    'ready': order.deliveryMethod === 'pickup' ? 'طلبك جاهز للاستلام' : 'طلبك جاهز وينتظر مندوب التوصيل',
    'out-for-delivery': 'طلبك في الطريق إليك',
    'delivered': 'تم توصيل طلبك',
    'picked-up': 'تم استلام طلبك',
    'cancelled': 'تم إلغاء الطلب'
  };
  
  // تحديد النسبة المئوية للحالة
  const statusPercentages = {
    'pending': 10,
    'confirmed': 25,
    'preparing': 50,
    'ready': 75,
    'out-for-delivery': 90,
    'delivered': 100,
    'picked-up': 100,
    'cancelled': 0
  };
  
  // إعداد معلومات الطلب
  const orderDate = new Date(order.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // تحديد الوقت المتوقع
  let estimatedTimeMessage = '';
  if (['pending', 'confirmed', 'preparing'].includes(order.status)) {
    if (order.estimatedPreparationTime) {
      const prepTime = new Date(order.estimatedPreparationTime);
      estimatedTimeMessage = `الوقت المتوقع للتحضير: ${prepTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      estimatedTimeMessage = 'الوقت المتوقع للتحضير: 20-30 دقيقة';
    }
  } else if (order.status === 'ready' && order.deliveryMethod === 'delivery') {
    estimatedTimeMessage = 'سيصلك الطلب خلال 15-30 دقيقة';
  } else if (order.status === 'out-for-delivery') {
    estimatedTimeMessage = 'سيصلك الطلب قريباً';
  }
  
  // عرض المحتوى
  container.innerHTML = `
    <section class="order-tracking-page section-padding">
      <div class="container">
        <div class="section-header">
          <h1>تتبع الطلب #${order._id.toString().slice(-6)}</h1>
          <p>${statusMessages[order.status]}</p>
        </div>
        
        <!-- حالة الطلب -->
        <div class="tracking-status-container">
          <div class="tracking-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${statusPercentages[order.status]}%"></div>
            </div>
            
            <div class="tracking-steps">
              <div class="tracking-step ${order.status !== 'cancelled' ? 'active' : ''}">
                <div class="step-icon">
                  <i class="icon-order"></i>
                </div>
                <div class="step-label">تم الطلب</div>
              </div>
              
              <div class="tracking-step ${['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'picked-up'].includes(order.status) ? 'active' : ''}">
                <div class="step-icon">
                  <i class="icon-confirm"></i>
                </div>
                <div class="step-label">تم التأكيد</div>
              </div>
              
              <div class="tracking-step ${['preparing', 'ready', 'out-for-delivery', 'delivered', 'picked-up'].includes(order.status) ? 'active' : ''}">
                <div class="step-icon">
                  <i class="icon-cooking"></i>
                </div>
                <div class="step-label">جاري التحضير</div>
              </div>
              
              <div class="tracking-step ${['ready', 'out-for-delivery', 'delivered', 'picked-up'].includes(order.status) ? 'active' : ''}">
                <div class="step-icon">
                  <i class="icon-ready"></i>
                </div>
                <div class="step-label">تم التحضير</div>
              </div>
              
              ${order.deliveryMethod === 'delivery' ? `
                <div class="tracking-step ${['out-for-delivery', 'delivered'].includes(order.status) ? 'active' : ''}">
                  <div class="step-icon">
                    <i class="icon-delivery"></i>
                  </div>
                  <div class="step-label">في الطريق</div>
                </div>
                
                <div class="tracking-step ${order.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon">
                    <i class="icon-delivered"></i>
                  </div>
                  <div class="step-label">تم التوصيل</div>
                </div>
              ` : `
                <div class="tracking-step ${order.status === 'picked-up' ? 'active' : ''}">
                  <div class="step-icon">
                    <i class="icon-pickup"></i>
                  </div>
                  <div class="step-label">تم الاستلام</div>
                </div>
              `}
            </div>
          </div>
          
          <div class="tracking-status">
            <div class="status-message">
              <h3>${statusMessages[order.status]}</h3>
              <p id="estimatedTime">${estimatedTimeMessage}</p>
            </div>
            
            <!-- الخريطة للتوصيل -->
            ${order.deliveryMethod === 'delivery' && order.status === 'out-for-delivery' ? `
              <div class="delivery-map-container">
                <div id="deliveryMap" class="delivery-map">
                  <!-- هنا ستظهر الخريطة -->
                  <div class="map-placeholder">جاري تحميل الخريطة...</div>
                </div>
              </div>
            ` : ''}
            
            <!-- معلومات الاستلام -->
            ${order.deliveryMethod === 'pickup' && order.status === 'ready' ? `
              <div class="pickup-info">
                <div class="pickup-icon">
                  <i class="icon-store"></i>
                </div>
                <div class="pickup-details">
                  <h3>طلبك جاهز للاستلام</h3>
                  <p>فرع بيت المحاشي - شارع الملك فهد</p>
                  <p>ساعات العمل: 11 صباحاً - 11 مساءً</p>
                  <p>رقم التواصل: +966 12 345 6789</p>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- تفاصيل الطلب -->
        <div class="order-details-container">
          <div class="order-details-header">
            <h2>تفاصيل الطلب</h2>
            <button id="viewReceiptBtn" class="btn btn-sm btn-outline">
              <i class="icon-receipt"></i> عرض الفاتورة
            </button>
          </div>
          
          <div class="order-details-grid">
            <div class="order-info">
              <div class="info-group">
                <h3>معلومات الطلب</h3>
                <p><strong>رقم الطلب:</strong> #${order._id.toString().slice(-6)}</p>
                <p><strong>تاريخ الطلب:</strong> ${orderDate}</p>
                <p><strong>طريقة التوصيل:</strong> ${order.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}</p>
                <p><strong>طريقة الدفع:</strong> ${getPaymentMethodInArabic(order.paymentMethod)}</p>
                <p><strong>حالة الدفع:</strong> ${getPaymentStatusInArabic(order.paymentStatus)}</p>
              </div>
              
              ${order.deliveryMethod === 'delivery' ? `
                <div class="info-group">
                  <h3>عنوان التوصيل</h3>
                  <p>${order.deliveryAddress?.address || 'غير محدد'}</p>
                  ${order.deliveryAddress?.buildingNumber ? `
                    <p>مبنى: ${order.deliveryAddress.buildingNumber}, شقة: ${order.deliveryAddress.apartmentNumber || '-'}</p>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            
            <div class="order-items">
              <h3>العناصر</h3>
              <div class="items-list">
                ${order.items.map(item => `
                  <div class="order-item">
                    <div class="item-details">
                      <h4>${item.quantity}x ${item.menuItem ? item.menuItem.name : 'عنصر غير معروف'}</h4>
                      ${item.options && item.options.length > 0 ? `
                        <div class="item-options">
                          <p>${item.options.map(opt => `${opt.name}: ${opt.choice}`).join(', ')}</p>
                        </div>
                      ` : ''}
                      ${item.specialInstructions ? `
                        <div class="item-instructions">
                          <p>${item.specialInstructions}</p>
                        </div>
                      ` : ''}
                    </div>
                    <div class="item-price">${formatCurrency(item.totalPrice || (item.price * item.quantity))}</div>
                  </div>
                `).join('')}
                
                <div class="order-subtotal order-summary-row">
                  <span>المجموع الفرعي:</span>
                  <span>${formatCurrency(order.totalPrice - order.deliveryFee)}</span>
                </div>
                
                <div class="order-delivery order-summary-row">
                  <span>رسوم التوصيل:</span>
                  <span>${formatCurrency(order.deliveryFee || 0)}</span>
                </div>
                
                ${order.discount > 0 ? `
                  <div class="order-discount order-summary-row">
                    <span>الخصم:</span>
                    <span>- ${formatCurrency(order.discount)}</span>
                  </div>
                ` : ''}
                
                <div class="order-total order-summary-row">
                  <span>الإجمالي:</span>
                  <span>${formatCurrency(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- أزرار الإجراءات -->
          <div class="order-actions">
            ${order.status === 'pending' ? `
              <button id="cancelOrderBtn" class="btn btn-outline">
                <i class="icon-cancel"></i> إلغاء الطلب
              </button>
            ` : ''}
            
            ${['delivered', 'picked-up'].includes(order.status) && !order.ratings ? `
              <button id="rateOrderBtn" class="btn btn-primary">
                <i class="icon-star"></i> تقييم الطلب
              </button>
            ` : ''}
            
            <a href="/menu" class="btn btn-primary" data-nav>
              <i class="icon-menu"></i> طلب مرة أخرى
            </a>
          </div>
        </div>
      </div>
    </section>
    
    <!-- نموذج تقييم الطلب -->
    <div class="modal" id="ratingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>تقييم الطلب</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="rating-form">
            <div class="rating-group">
              <label>جودة الطعام</label>
              <div class="star-rating" data-rating="food">
                <span class="star" data-value="1">★</span>
                <span class="star" data-value="2">★</span>
                <span class="star" data-value="3">★</span>
                <span class="star" data-value="4">★</span>
                <span class="star" data-value="5">★</span>
              </div>
            </div>
            
            ${order.deliveryMethod === 'delivery' ? `
              <div class="rating-group">
                <label>خدمة التوصيل</label>
                <div class="star-rating" data-rating="delivery">
                  <span class="star" data-value="1">★</span>
                  <span class="star" data-value="2">★</span>
                  <span class="star" data-value="3">★</span>
                  <span class="star" data-value="4">★</span>
                  <span class="star" data-value="5">★</span>
                </div>
              </div>
            ` : ''}
            
            <div class="rating-group">
              <label>التجربة العامة</label>
              <div class="star-rating" data-rating="experience">
                <span class="star" data-value="1">★</span>
                <span class="star" data-value="2">★</span>
                <span class="star" data-value="3">★</span>
                <span class="star" data-value="4">★</span>
                <span class="star" data-value="5">★</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="ratingComment">ملاحظات إضافية (اختياري)</label>
              <textarea id="ratingComment" class="form-control" rows="3"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelRatingBtn">إلغاء</button>
          <button class="btn btn-primary" id="submitRatingBtn">إرسال التقييم</button>
        </div>
      </div>
    </div>
  `;
  
  // تهيئة خريطة التوصيل (إذا كانت مطلوبة)
  if (order.deliveryMethod === 'delivery' && order.status === 'out-for-delivery') {
    initDeliveryMap(order);
  }
}

// إضافة معالجات الأحداث
function addEventListeners(container, order) {
  // زر عرض الفاتورة
  const viewReceiptBtn = container.querySelector('#viewReceiptBtn');
  if (viewReceiptBtn) {
    viewReceiptBtn.addEventListener('click', () => {
      // في تطبيق حقيقي، هنا سيتم فتح نافذة أو تنزيل الفاتورة
      showLocalNotification('عرض الفاتورة', 'جاري تجهيز الفاتورة للطباعة');
    });
  }
  
  // زر إلغاء الطلب
  const cancelOrderBtn = container.querySelector('#cancelOrderBtn');
  if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener('click', () => {
      // تأكيد إلغاء الطلب
      if (confirm('هل أنت متأكد من رغبتك في إلغاء الطلب؟')) {
        handleCancelOrder(order._id);
      }
    });
  }
  
  // زر تقييم الطلب
  const rateOrderBtn = container.querySelector('#rateOrderBtn');
  const ratingModal = container.querySelector('#ratingModal');
  
  if (rateOrderBtn && ratingModal) {
    rateOrderBtn.addEventListener('click', () => {
      ratingModal.style.display = 'block';
    });
    
    // إغلاق نموذج التقييم
    const closeModalBtn = ratingModal.querySelector('.close-modal');
    const cancelRatingBtn = ratingModal.querySelector('#cancelRatingBtn');
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        ratingModal.style.display = 'none';
      });
    }
    
    if (cancelRatingBtn) {
      cancelRatingBtn.addEventListener('click', () => {
        ratingModal.style.display = 'none';
      });
    }
    
    // إرسال التقييم
    const submitRatingBtn = ratingModal.querySelector('#submitRatingBtn');
    if (submitRatingBtn) {
      submitRatingBtn.addEventListener('click', () => {
        handleSubmitRating(order._id, ratingModal);
      });
    }
    
    // معالجة النقر على النجوم
    const starRatings = ratingModal.querySelectorAll('.star-rating');
    starRatings.forEach(ratingGroup => {
      const stars = ratingGroup.querySelectorAll('.star');
      const ratingType = ratingGroup.getAttribute('data-rating');
      
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const value = parseInt(star.getAttribute('data-value'));
          // تحديث حالة النجوم المحددة
          updateStarRating(stars, value);
          // تخزين القيمة في خاصية البيانات
          ratingGroup.setAttribute('data-value', value);
        });
      });
    });
  }
}

// تحديث حالة نجوم التقييم
function updateStarRating(stars, selectedValue) {
  stars.forEach(star => {
    const value = parseInt(star.getAttribute('data-value'));
    if (value <= selectedValue) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
}

// معالجة إلغاء الطلب
async function handleCancelOrder(orderId) {
  try {
    // في تطبيق حقيقي، هنا سيتم إرسال طلب إلغاء للخادم
    
    // محاكاة نجاح الإلغاء
    showLocalNotification('تم إلغاء الطلب', 'تم إلغاء طلبك بنجاح');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      router.navigate(`/order-tracking?orderId=${orderId}`);
    }, 1000);
  } catch (error) {
    console.error('خطأ في إلغاء الطلب:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء محاولة إلغاء الطلب', 'error');
  }
}

// معالجة إرسال التقييم
async function handleSubmitRating(orderId, modal) {
  try {
    // جمع بيانات التقييم
    const foodRating = parseInt(modal.querySelector('[data-rating="food"]').getAttribute('data-value') || 0);
    const deliveryRating = modal.querySelector('[data-rating="delivery"]') ? 
      parseInt(modal.querySelector('[data-rating="delivery"]').getAttribute('data-value') || 0) : 
      null;
    const experienceRating = parseInt(modal.querySelector('[data-rating="experience"]').getAttribute('data-value') || 0);
    const comment = modal.querySelector('#ratingComment').value;
    
    // التحقق من ملء التقييمات المطلوبة
    if (!foodRating || !experienceRating) {
      showLocalNotification('تنبيه', 'يرجى تقييم جودة الطعام والتجربة العامة', 'warning');
      return;
    }
    
    // إنشاء كائن التقييم
    const ratingData = {
      food: foodRating,
      experience: experienceRating,
      comment
    };
    
    if (deliveryRating) {
      ratingData.delivery = deliveryRating;
    }
    
    // في تطبيق حقيقي، هنا سيتم إرسال التقييم للخادم
    
    // محاكاة نجاح التقييم
    modal.style.display = 'none';
    showLocalNotification('تم إرسال التقييم', 'شكراً لك على تقييمك! نقدر ملاحظاتك.');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      router.navigate(`/order-tracking?orderId=${orderId}`);
    }, 1000);
  } catch (error) {
    console.error('خطأ في إرسال التقييم:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء إرسال التقييم', 'error');
  }
}

// تهيئة خريطة التوصيل
function initDeliveryMap(order) {
  const mapContainer = document.getElementById('deliveryMap');
  if (!mapContainer) return;
  
  // في تطبيق حقيقي، هنا سيتم تهيئة خريطة باستخدام API مثل Leaflet أو Google Maps
  
  // محاكاة تحميل الخريطة
  mapContainer.innerHTML = `
    <div class="delivery-map-placeholder">
      <div class="map-route">
        <div class="route-point restaurant">
          <i class="icon-store"></i>
          <span>المطعم</span>
        </div>
        <div class="route-line">
          <div class="route-progress"></div>
          <div class="delivery-icon">
            <i class="icon-motorcycle"></i>
          </div>
        </div>
        <div class="route-point destination">
          <i class="icon-home"></i>
          <span>موقعك</span>
        </div>
      </div>
      <div class="estimated-arrival">
        <p>الوقت المتوقع للوصول: 15 دقيقة</p>
      </div>
    </div>
  `;
  
  // محاكاة حركة المندوب
  const routeProgress = mapContainer.querySelector('.route-progress');
  const deliveryIcon = mapContainer.querySelector('.delivery-icon');
  
  let progress = 0;
  const updateInterval = setInterval(() => {
    progress += 1;
    if (progress > 100) {
      clearInterval(updateInterval);
      return;
    }
    
    routeProgress.style.width = `${progress}%`;
    deliveryIcon.style.left = `${progress}%`;
    
    // تحديث الوقت المتوقع
    const estimatedArrival = mapContainer.querySelector('.estimated-arrival p');
    const remainingMinutes = Math.ceil(15 * (1 - progress / 100));
    
    if (estimatedArrival) {
      if (remainingMinutes > 0) {
        estimatedArrival.textContent = `الوقت المتوقع للوصول: ${remainingMinutes} دقيقة`;
      } else {
        estimatedArrival.textContent = 'المندوب وصل إلى موقعك!';
      }
    }
  }, 1000);
}

// بدء التحديث الدوري لحالة الطلب
function startOrderStatusPolling(container, orderId) {
  const pollingInterval = setInterval(async () => {
    try {
      // جلب بيانات الطلب المحدثة
      const order = await getOrderById(orderId);
      
      // تحديث حالة الطلب في الواجهة إذا تغيرت
      updateOrderStatus(container, order);
      
      // إيقاف التحديث إذا وصل الطلب لحالة نهائية
      if (['delivered', 'picked-up', 'cancelled'].includes(order.status)) {
        clearInterval(pollingInterval);
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
    }
  }, 30000); // تحديث كل 30 ثانية
  
  // تنظيف عند مغادرة الصفحة
  return () => {
    clearInterval(pollingInterval);
  };
}

// تحديث حالة الطلب في الواجهة
function updateOrderStatus(container, updatedOrder) {
  // إعادة عرض الصفحة بالبيانات المحدثة
  renderOrderTrackingContent(container, updatedOrder);
  
  // إضافة معالجات الأحداث
  addEventListeners(container, updatedOrder);
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

// دالة للحصول على طريقة الدفع بالعربية
function getPaymentMethodInArabic(method) {
  const methodMap = {
    'cash': 'نقدي عند الاستلام',
    'card': 'بطاقة ائتمان',
    'wallet': 'محفظة إلكترونية'
  };
  
  return methodMap[method] || method;
}

// دالة للحصول على حالة الدفع بالعربية
function getPaymentStatusInArabic(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'paid': 'تم الدفع',
    'failed': 'فشل الدفع',
    'refunded': 'تم استرداد المبلغ'
  };
  
  return statusMap[status] || status;
}