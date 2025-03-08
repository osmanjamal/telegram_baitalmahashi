import { store } from '../../js/store.js';
import { getActiveOrders, updateOrderStatus } from '../../js/api.js';
import { showLocalNotification } from '../../js/notifications.js';

export function renderKitchenDashboard(container) {
  // التحقق من صلاحيات المستخدم
  const user = store.getState().auth.user;
  if (!user || (!user.isKitchenStaff && !user.isAdmin)) {
    container.innerHTML = `
      <div class="container text-center" style="padding-top: 100px;">
        <h1>غير مصرح</h1>
        <p>عذراً، ليس لديك صلاحية الوصول إلى هذه الصفحة.</p>
        <a href="/" class="btn btn-primary" data-nav>العودة للصفحة الرئيسية</a>
      </div>
    `;
    return;
  }
  
  // عرض لوحة تحكم المطبخ
  container.innerHTML = `
    <div class="kitchen-layout">
      <!-- شريط التنقل -->
      <header class="kitchen-header">
        <div class="kitchen-logo">
          <img src="/assets/images/logo/logo-full.png" alt="بيت المحاشي">
        </div>
        <h1>لوحة تحكم المطبخ</h1>
        <div class="kitchen-actions">
          <button id="refreshBtn" class="btn btn-sm"><i class="icon-refresh"></i> تحديث</button>
          <button id="logoutBtn" class="btn btn-sm btn-outline"><i class="icon-logout"></i> تسجيل الخروج</button>
        </div>
      </header>
      
      <!-- الإحصائيات -->
      <div class="kitchen-stats-bar">
        <div class="stat-item">
          <span class="stat-label">طلبات جديدة</span>
          <span class="stat-value" id="pendingOrdersCount">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">قيد التحضير</span>
          <span class="stat-value" id="preparingOrdersCount">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">جاهزة</span>
          <span class="stat-value" id="readyOrdersCount">0</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">إجمالي اليوم</span>
          <span class="stat-value" id="totalOrdersCount">0</span>
        </div>
      </div>
      
      <!-- أقسام الطلبات -->
      <div class="kitchen-orders-container">
        <div class="orders-columns">
          <!-- الطلبات الجديدة -->
          <div class="order-column">
            <div class="column-header">
              <h2>طلبات جديدة</h2>
              <span class="badge" id="pendingBadge">0</span>
            </div>
            <div class="order-list" id="pendingOrders">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <!-- الطلبات المؤكدة -->
          <div class="order-column">
            <div class="column-header">
              <h2>طلبات مؤكدة</h2>
              <span class="badge" id="confirmedBadge">0</span>
            </div>
            <div class="order-list" id="confirmedOrders">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <!-- الطلبات قيد التحضير -->
          <div class="order-column">
            <div class="column-header">
              <h2>قيد التحضير</h2>
              <span class="badge" id="preparingBadge">0</span>
            </div>
            <div class="order-list" id="preparingOrders">
              <div class="loading-spinner"></div>
            </div>
          </div>
          
          <!-- الطلبات الجاهزة -->
          <div class="order-column">
            <div class="column-header">
              <h2>طلبات جاهزة</h2>
              <span class="badge" id="readyBadge">0</span>
            </div>
            <div class="order-list" id="readyOrders">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- نموذج تحديث حالة الطلب -->
    <div class="modal" id="updateOrderModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>تحديث حالة الطلب</h3>
          <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="orderStatus">الحالة الجديدة</label>
            <select class="form-control" id="orderStatus">
              <option value="confirmed">تأكيد الطلب</option>
              <option value="preparing">قيد التحضير</option>
              <option value="ready">جاهز للتسليم</option>
              <option value="cancelled">إلغاء الطلب</option>
            </select>
          </div>
          <div class="form-group">
            <label for="statusNote">ملاحظات (اختياري)</label>
            <textarea class="form-control" id="statusNote" rows="3"></textarea>
          </div>
          <input type="hidden" id="orderId">
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelUpdateBtn">إلغاء</button>
          <button class="btn btn-primary" id="confirmUpdateBtn">تحديث</button>
        </div>
      </div>
    </div>
  `;
  
  // جلب الطلبات النشطة
  loadActiveOrders();
  
  // بدء التحديث الدوري
  const refreshInterval = setInterval(loadActiveOrders, 60000); // تحديث كل دقيقة
  
  // معالجة أحداث الأزرار
  document.getElementById('refreshBtn').addEventListener('click', loadActiveOrders);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // معالجة النموذج
  const modal = document.getElementById('updateOrderModal');
  const closeModalBtn = modal.querySelector('.close-modal');
  const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
  const confirmUpdateBtn = document.getElementById('confirmUpdateBtn');
  
  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  cancelUpdateBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  confirmUpdateBtn.addEventListener('click', handleUpdateOrder);
  
  // تنظيف عند مغادرة الصفحة
  return () => {
    clearInterval(refreshInterval);
  };
}

// دالة لتحميل الطلبات النشطة
async function loadActiveOrders() {
  try {
    const orders = await getActiveOrders();
    
    // فرز الطلبات حسب الحالة
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const confirmedOrders = orders.filter(order => order.status === 'confirmed');
    const preparingOrders = orders.filter(order => order.status === 'preparing');
    const readyOrders = orders.filter(order => order.status === 'ready');
    
    // تحديث عدادات الطلبات
    document.getElementById('pendingOrdersCount').textContent = pendingOrders.length;
    document.getElementById('preparingOrdersCount').textContent = preparingOrders.length;
    document.getElementById('readyOrdersCount').textContent = readyOrders.length;
    document.getElementById('totalOrdersCount').textContent = orders.length;
    
    // تحديث شارات الأقسام
    document.getElementById('pendingBadge').textContent = pendingOrders.length;
    document.getElementById('confirmedBadge').textContent = confirmedOrders.length;
    document.getElementById('preparingBadge').textContent = preparingOrders.length;
    document.getElementById('readyBadge').textContent = readyOrders.length;
    
    // عرض الطلبات في كل قسم
    renderOrdersList('pendingOrders', pendingOrders);
    renderOrdersList('confirmedOrders', confirmedOrders);
    renderOrdersList('preparingOrders', preparingOrders);
    renderOrdersList('readyOrders', readyOrders);
    
    // تشغيل صوت تنبيه إذا كان هناك طلبات جديدة
    if (pendingOrders.length > 0) {
      playNewOrderSound();
    }
  } catch (error) {
    console.error('خطأ في تحميل الطلبات النشطة:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تحميل الطلبات النشطة');
  }
}

// دالة لعرض قائمة الطلبات
function renderOrdersList(containerId, orders) {
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-list">لا توجد طلبات</div>';
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <h3>طلب #${order._id.toString().slice(-6)}</h3>
        <span class="order-time">${formatTime(order.createdAt)}</span>
      </div>
      
      <div class="order-details">
        <p><strong>العميل:</strong> ${order.user ? order.user.name : 'غير معروف'}</p>
        <p><strong>نوع الطلب:</strong> ${order.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}</p>
        
        <div class="order-items">
          <h4>العناصر:</h4>
          <ul>
            ${order.items.map(item => `
              <li>
                ${item.quantity}× ${item.menuItem ? item.menuItem.name : 'عنصر غير معروف'}
                ${item.options && item.options.length > 0 ? 
                  `<small>(${item.options.map(opt => `${opt.name}: ${opt.choice}`).join(', ')})</small>` : 
                  ''}
                ${item.specialInstructions ? 
                  `<small class="special-instructions">${item.specialInstructions}</small>` : 
                  ''}
              </li>
            `).join('')}
          </ul>
        </div>
        
        <p><strong>الإجمالي:</strong> ${formatCurrency(order.totalPrice)}</p>
      </div>
      
      <div class="order-actions">
        <button class="btn btn-primary order-action-btn" data-order-id="${order._id}" data-action="update">
          تحديث الحالة
        </button>
        
        ${getQuickActionButtons(order)}
      </div>
    </div>
  `).join('');
  
  // إضافة معالجات الأحداث للأزرار
  container.querySelectorAll('.order-action-btn').forEach(button => {
    button.addEventListener('click', handleOrderAction);
  });
}

// دالة للحصول على أزرار الإجراءات السريعة حسب حالة الطلب
function getQuickActionButtons(order) {
  switch (order.status) {
    case 'pending':
      return `
        <button class="btn btn-sm order-action-btn" data-order-id="${order._id}" data-action="quick-confirm">
          تأكيد
        </button>
        <button class="btn btn-sm btn-outline order-action-btn" data-order-id="${order._id}" data-action="quick-cancel">
          إلغاء
        </button>
      `;
    case 'confirmed':
      return `
        <button class="btn btn-sm order-action-btn" data-order-id="${order._id}" data-action="quick-prepare">
          بدء التحضير
        </button>
      `;
    case 'preparing':
      return `
        <button class="btn btn-sm order-action-btn" data-order-id="${order._id}" data-action="quick-ready">
          جاهز
        </button>
      `;
    default:
      return '';
  }
}

// معالجة إجراءات الطلب
function handleOrderAction(event) {
  const orderId = event.target.getAttribute('data-order-id');
  const action = event.target.getAttribute('data-action');
  
  if (!orderId) return;
  
  // معالجة الإجراءات السريعة
  if (action.startsWith('quick-')) {
    handleQuickAction(orderId, action);
    return;
  }
  
  // عرض نموذج تحديث الحالة
  if (action === 'update') {
    showUpdateOrderModal(orderId);
  }
}

// معالجة الإجراءات السريعة
async function handleQuickAction(orderId, action) {
  try {
    let status, note;
    
    switch (action) {
      case 'quick-confirm':
        status = 'confirmed';
        note = 'تم تأكيد الطلب';
        break;
      case 'quick-prepare':
        status = 'preparing';
        note = 'بدأ تحضير الطلب';
        break;
      case 'quick-ready':
        status = 'ready';
        note = 'الطلب جاهز للتسليم';
        break;
      case 'quick-cancel':
        status = 'cancelled';
        note = 'تم إلغاء الطلب من قبل المطبخ';
        break;
      default:
        return;
    }
    
    // تحديث حالة الطلب
    const result = await updateOrderStatus(orderId, status, note);
    
    if (result.success) {
      showLocalNotification('نجاح', `تم تحديث حالة الطلب إلى "${getStatusInArabic(status)}"`);
      // إعادة تحميل الطلبات
      loadActiveOrders();
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تحديث حالة الطلب');
    }
  } catch (error) {
    console.error('خطأ في معالجة الإجراء السريع:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء معالجة الإجراء');
  }
}

// عرض نموذج تحديث حالة الطلب
function showUpdateOrderModal(orderId) {
  document.getElementById('orderId').value = orderId;
  document.getElementById('orderStatus').value = 'confirmed';
  document.getElementById('statusNote').value = '';
  document.getElementById('updateOrderModal').style.display = 'block';
}

// معالجة تحديث حالة الطلب
async function handleUpdateOrder() {
  try {
    const orderId = document.getElementById('orderId').value;
    const status = document.getElementById('orderStatus').value;
    const note = document.getElementById('statusNote').value;
    
    if (!orderId || !status) {
      showLocalNotification('خطأ', 'البيانات غير مكتملة');
      return;
    }
    
    // تحديث حالة الطلب
    const result = await updateOrderStatus(orderId, status, note);
    
    if (result.success) {
      showLocalNotification('نجاح', `تم تحديث حالة الطلب إلى "${getStatusInArabic(status)}"`);
      // إغلاق النموذج
      document.getElementById('updateOrderModal').style.display = 'none';
      // إعادة تحميل الطلبات
      loadActiveOrders();
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تحديث حالة الطلب');
    }
  } catch (error) {
    console.error('خطأ في تحديث حالة الطلب:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
  }
}

// تشغيل صوت طلب جديد
function playNewOrderSound() {
  const audio = new Audio('/assets/sounds/new-order.mp3');
  audio.play().catch(error => {
    console.error('فشل تشغيل صوت الطلب الجديد:', error);
  });
}

// دالة لتسجيل الخروج
function handleLogout() {
  store.logout();
  window.location.href = '/auth';
}

// دالة لتنسيق الوقت
function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

// دالة للحصول على حالة الطلب بالعربية
function getStatusInArabic(status) {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'confirmed': 'مؤكد',
    'preparing': 'قيد التحضير',
    'ready': 'جاهز',
    'out-for-delivery': 'في الطريق',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغي'
  };
  
  return statusMap[status] || status;
}