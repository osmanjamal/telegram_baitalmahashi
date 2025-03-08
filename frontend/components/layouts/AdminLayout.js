import { store } from '../../js/store.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';

export function renderAdminDashboard(container) {
  // التحقق من صلاحيات المستخدم
  const user = store.getState().auth.user;
  if (!user || !user.isAdmin) {
    container.innerHTML = `
      <div class="container text-center" style="padding-top: 100px;">
        <h1>غير مصرح</h1>
        <p>عذراً، ليس لديك صلاحية الوصول إلى هذه الصفحة.</p>
        <a href="/" class="btn btn-primary" data-nav>العودة للصفحة الرئيسية</a>
      </div>
    `;
    return;
  }
  
  // عرض لوحة تحكم المشرف
  container.innerHTML = `
    <div class="admin-layout">
      <!-- القائمة الجانبية -->
      <aside class="admin-sidebar">
        <div class="admin-logo">
          <img src="/assets/images/logo/logo-full.png" alt="بيت المحاشي">
        </div>
        
        <nav class="admin-nav">
          <ul>
            <li>
              <a href="#dashboard" class="admin-nav-item active" data-section="dashboard">
                <i class="icon-dashboard"></i> لوحة التحكم
              </a>
            </li>
            <li>
              <a href="#orders" class="admin-nav-item" data-section="orders">
                <i class="icon-order"></i> الطلبات
              </a>
            </li>
            <li>
              <a href="#menu" class="admin-nav-item" data-section="menu">
                <i class="icon-menu"></i> القائمة
              </a>
            </li>
            <li>
              <a href="#users" class="admin-nav-item" data-section="users">
                <i class="icon-user"></i> المستخدمون
              </a>
            </li>
            <li>
              <a href="#reports" class="admin-nav-item" data-section="reports">
                <i class="icon-chart"></i> التقارير
              </a>
            </li>
            <li>
              <a href="#settings" class="admin-nav-item" data-section="settings">
                <i class="icon-settings"></i> الإعدادات
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="admin-sidebar-footer">
          <button id="logoutBtn" class="btn btn-outline btn-block">
            <i class="icon-logout"></i> تسجيل الخروج
          </button>
        </div>
      </aside>
      
      <!-- المحتوى الرئيسي -->
      <main class="admin-content">
        <header class="admin-header">
          <h1 id="sectionTitle">لوحة التحكم</h1>
          
          <div class="admin-user">
            <span>${user.name}</span>
            <img src="${user.avatar || '/assets/images/ui/user-avatar.png'}" alt="${user.name}">
          </div>
        </header>
        
        <div class="admin-container" id="adminContainer">
          <div id="dashboardSection" class="admin-section active">
            <div class="admin-section-header">
              <h2>نظرة عامة</h2>
              <div class="date-range">
                <select id="dateRangeSelector" class="form-control">
                  <option value="today">اليوم</option>
                  <option value="yesterday">الأمس</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                </select>
              </div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-card-icon" style="background-color: #e3f2fd;">
                  <i class="icon-order" style="color: #2196f3;"></i>
                </div>
                <div class="stat-card-content">
                  <h3>الطلبات</h3>
                  <div class="stat-card-value" id="ordersCount">0</div>
                  <div class="stat-card-change positive">+5% من الأمس</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-card-icon" style="background-color: #e8f5e9;">
                  <i class="icon-money" style="color: #4caf50;"></i>
                </div>
                <div class="stat-card-content">
                  <h3>الإيرادات</h3>
                  <div class="stat-card-value" id="revenueAmount">0 ريال</div>
                  <div class="stat-card-change positive">+8% من الأمس</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-card-icon" style="background-color: #ede7f6;">
                  <i class="icon-user" style="color: #673ab7;"></i>
                </div>
                <div class="stat-card-content">
                  <h3>العملاء</h3>
                  <div class="stat-card-value" id="customersCount">0</div>
                  <div class="stat-card-change positive">+3% من الأمس</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-card-icon" style="background-color: #fff8e1;">
                  <i class="icon-dish" style="color: #ffc107;"></i>
                </div>
                <div class="stat-card-content">
                  <h3>الأطباق المباعة</h3>
                  <div class="stat-card-value" id="dishesCount">0</div>
                  <div class="stat-card-change negative">-2% من الأمس</div>
                </div>
              </div>
            </div>
            
            <div class="charts-grid">
              <div class="chart-card">
                <div class="chart-card-header">
                  <h3>معدل الطلبات</h3>
                  <div class="chart-actions">
                    <button class="btn btn-sm btn-outline">تصدير</button>
                  </div>
                </div>
                <div class="chart-container" id="ordersChart">
                  <div class="loading-spinner"></div>
                </div>
              </div>
              
              <div class="chart-card">
                <div class="chart-card-header">
                  <h3>الأطباق الأكثر مبيعاً</h3>
                  <div class="chart-actions">
                    <button class="btn btn-sm btn-outline">تصدير</button>
                  </div>
                </div>
                <div class="chart-container" id="topDishesChart">
                  <div class="loading-spinner"></div>
                </div>
              </div>
            </div>
            
            <div class="recent-orders">
              <div class="admin-section-header">
                <h2>أحدث الطلبات</h2>
                <a href="#orders" class="btn btn-sm" data-section="orders">عرض الكل</a>
              </div>
              
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>الحالة</th>
                      <th>المبلغ</th>
                      <th>التاريخ</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody id="recentOrdersTable">
                    <tr>
                      <td colspan="6" class="text-center">
                        <div class="loading-spinner"></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div id="ordersSection" class="admin-section">
            <h2>إدارة الطلبات</h2>
            <div class="loading-spinner"></div>
          </div>
          
          <div id="menuSection" class="admin-section">
            <h2>إدارة القائمة</h2>
            <div class="loading-spinner"></div>
          </div>
          
          <div id="usersSection" class="admin-section">
            <h2>إدارة المستخدمين</h2>
            <div class="loading-spinner"></div>
          </div>
          
          <div id="reportsSection" class="admin-section">
            <h2>التقارير</h2>
            <div class="loading-spinner"></div>
          </div>
          
          <div id="settingsSection" class="admin-section">
            <h2>إعدادات النظام</h2>
            <div class="loading-spinner"></div>
          </div>
        </div>
      </main>
    </div>
  `;
  
  // تحميل البيانات
  loadDashboardData();
  
  // معالجة النقر على عناصر القائمة
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // إزالة الفئة النشطة من جميع العناصر
      document.querySelectorAll('.admin-nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // إضافة الفئة النشطة للعنصر المحدد
      this.classList.add('active');
      
      // الحصول على القسم المطلوب
      const section = this.getAttribute('data-section');
      
      // إخفاء جميع الأقسام
      document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
      });
      
      // عرض القسم المطلوب
      document.getElementById(`${section}Section`).classList.add('active');
      
      // تحديث عنوان القسم
      document.getElementById('sectionTitle').textContent = this.textContent.trim();
      
      // تحميل بيانات القسم
      loadSectionData(section);
    });
  });
  
  // معالجة تسجيل الخروج
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // معالجة تغيير نطاق التاريخ
  document.getElementById('dateRangeSelector').addEventListener('change', function() {
    loadDashboardData(this.value);
  });
}

// تحميل بيانات لوحة التحكم
async function loadDashboardData(dateRange = 'today') {
  try {
    // تحميل البيانات من الخادم
    const response = await fetch(`/api/admin/dashboard?range=${dateRange}`, {
      headers: {
        'x-auth-token': store.getState().auth.token
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل تحميل بيانات لوحة التحكم');
    }
    
    // تحديث الإحصائيات
    document.getElementById('ordersCount').textContent = data.data.stats.ordersCount;
    document.getElementById('revenueAmount').textContent = formatCurrency(data.data.stats.revenue);
    document.getElementById('customersCount').textContent = data.data.stats.customersCount;
    document.getElementById('dishesCount').textContent = data.data.stats.dishesCount;
    
    // تحديث الطلبات الأخيرة
    renderRecentOrders(data.data.recentOrders);
    
    // تحديث الرسوم البيانية
    renderOrdersChart(data.data.ordersChart);
    renderTopDishesChart(data.data.topDishes);
  } catch (error) {
    console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تحميل بيانات لوحة التحكم');
  }
}

// تحميل بيانات القسم
function loadSectionData(section) {
  switch (section) {
    case 'orders':
      loadOrdersData();
      break;
    case 'menu':
      loadMenuData();
      break;
    case 'users':
      loadUsersData();
      break;
    case 'reports':
      loadReportsData();
      break;
    case 'settings':
      loadSettingsData();
      break;
  }
}

// عرض الطلبات الأخيرة
function renderRecentOrders(orders) {
  const container = document.getElementById('recentOrdersTable');
  
  if (!container) return;
  
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">لا توجد طلبات حديثة</td>
      </tr>
    `;
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <tr>
      <td>#${order._id.toString().slice(-6)}</td>
      <td>${order.user ? order.user.name : 'غير معروف'}</td>
      <td>
        <span class="status-badge status-${order.status}">
          ${getStatusInArabic(order.status)}
        </span>
      </td>
      <td>${formatCurrency(order.totalPrice)}</td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" data-order-id="${order._id}" data-action="view-order">
            <i class="icon-eye"></i>
          </button>
          <button class="btn-icon" data-order-id="${order._id}" data-action="edit-order">
            <i class="icon-edit"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // إضافة معالجات الأحداث للأزرار
  container.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', handleOrderAction);
  });
}

// معالجة إجراء طلب
function handleOrderAction(event) {
  const action = event.currentTarget.getAttribute('data-action');
  const orderId = event.currentTarget.getAttribute('data-order-id');
  
  if (!orderId) return;
  
  switch (action) {
    case 'view-order':
      // عرض تفاصيل الطلب
      showOrderDetails(orderId);
      break;
    case 'edit-order':
      // تحرير الطلب
      showEditOrder(orderId);
      break;
  }
}

// دالة لتسجيل الخروج
function handleLogout() {
  store.logout();
  router.navigate('/auth');
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

// دالة لتنسيق التاريخ
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

// دوال الرسوم البيانية

// رسم بياني لمعدل الطلبات
function renderOrdersChart(data) {
  const container = document.getElementById('ordersChart');
  
  if (!container) return;
  
  // في تطبيق حقيقي، استخدم مكتبة رسوم بيانية مثل Chart.js
  container.innerHTML = `
    <div class="placeholder-chart">
      <div class="placeholder-chart-bars">
        ${data.map(item => `
          <div class="placeholder-chart-bar" style="height: ${item.value * 2}px;">
            <span class="placeholder-chart-value">${item.value}</span>
          </div>
        `).join('')}
      </div>
      <div class="placeholder-chart-labels">
        ${data.map(item => `
          <div class="placeholder-chart-label">${item.label}</div>
        `).join('')}
      </div>
    </div>
  `;
}

// رسم بياني للأطباق الأكثر مبيعاً
function renderTopDishesChart(data) {
  const container = document.getElementById('topDishesChart');
  
  if (!container) return;
  
  // في تطبيق حقيقي، استخدم مكتبة رسوم بيانية مثل Chart.js
  container.innerHTML = `
    <div class="placeholder-chart">
      <div class="placeholder-chart-horizontal-bars">
        ${data.map(item => `
          <div class="placeholder-chart-horizontal-bar-item">
            <div class="placeholder-chart-horizontal-bar-label">${item.name}</div>
            <div class="placeholder-chart-horizontal-bar-container">
              <div class="placeholder-chart-horizontal-bar" style="width: ${(item.count / Math.max(...data.map(d => d.count))) * 100}%;">
                <span class="placeholder-chart-horizontal-bar-value">${item.count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// دوال تحميل بيانات الأقسام (في تطبيق حقيقي، قم بتنفيذ هذه الدوال)
function loadOrdersData() {
  // تنفيذ في التطبيق الحقيقي
}

function loadMenuData() {
  // تنفيذ في التطبيق الحقيقي
}

function loadUsersData() {
  // تنفيذ في التطبيق الحقيقي
}

function loadReportsData() {
  // تنفيذ في التطبيق الحقيقي
}

function loadSettingsData() {
  // تنفيذ في التطبيق الحقيقي
}

// دوال لعرض تفاصيل وتحرير الطلبات (في تطبيق حقيقي، قم بتنفيذ هذه الدوال)
function showOrderDetails(orderId) {
  // تنفيذ في التطبيق الحقيقي
}

function showEditOrder(orderId) {
  // تنفيذ في التطبيق الحقيقي
}