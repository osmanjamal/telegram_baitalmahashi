import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { getUserProfile, getUserOrders, updateUserProfile, addAddress } from '../../js/api.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';
import { renderLocationPicker } from '../shared/LocationPicker.js';
import { logout } from '../../js/api.js';

// دالة عرض صفحة الملف الشخصي
export async function renderProfile(container) {
  // التحقق من حالة المصادقة
  const { isAuthenticated } = store.getState().auth;
  if (!isAuthenticated) {
    // تخزين صفحة الملف الشخصي كصفحة إعادة توجيه بعد تسجيل الدخول
    store.updateState('auth.redirectAfterLogin', '/profile');
    router.navigate('/auth');
    return;
  }
  
  // عرض تخطيط الصفحة مع شاشة تحميل
  const contentContainer = renderMainLayout(container, '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>');
  
  try {
    // جلب بيانات الملف الشخصي وطلبات المستخدم
    await Promise.all([
      getUserProfile(),
      getUserOrders()
    ]);
    
    // الحصول على بيانات المستخدم من المخزن
    const { user } = store.getState().auth;
    const { orderHistory } = store.getState().orders;
    
    // تحديد علامة التبويب النشطة من URL
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab') || 'profile';
    
    // عرض محتوى الصفحة
    contentContainer.innerHTML = `
      <section class="profile-page section-padding">
        <div class="container">
          <div class="section-header">
            <h1>الملف الشخصي</h1>
            <p>مرحباً ${user.name}! إدارة حسابك وتتبع طلباتك السابقة</p>
          </div>
          
          <div class="profile-container">
            <!-- القائمة الجانبية -->
            <aside class="profile-sidebar">
              <div class="user-info">
                <div class="user-avatar">
                  <img src="${user.avatar || '/assets/images/ui/user-avatar.png'}" alt="${user.name}">
                </div>
                <h3>${user.name}</h3>
                <p>${user.telegramId ? '@' + user.username : user.email || ''}</p>
              </div>
              
              <nav class="profile-nav">
                <a href="?tab=profile" class="profile-nav-item ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
                  <i class="icon-user"></i> المعلومات الشخصية
                </a>
                <a href="?tab=orders" class="profile-nav-item ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
                  <i class="icon-order"></i> طلباتي
                </a>
                <a href="?tab=addresses" class="profile-nav-item ${activeTab === 'addresses' ? 'active' : ''}" data-tab="addresses">
                  <i class="icon-location"></i> عناويني
                </a>
                <a href="?tab=loyalty" class="profile-nav-item ${activeTab === 'loyalty' ? 'active' : ''}" data-tab="loyalty">
                  <i class="icon-loyalty"></i> برنامج الولاء
                </a>
                <a href="?tab=notifications" class="profile-nav-item ${activeTab === 'notifications' ? 'active' : ''}" data-tab="notifications">
                  <i class="icon-notification"></i> الإشعارات
                </a>
                <a href="#" class="profile-nav-item" id="logoutBtn">
                  <i class="icon-logout"></i> تسجيل الخروج
                </a>
              </nav>
            </aside>
            
            <!-- محتوى الصفحة -->
            <main class="profile-content">
              <!-- معلومات الملف الشخصي -->
              <div class="profile-tab-content ${activeTab === 'profile' ? 'active' : ''}" id="profileTab">
                <h2>المعلومات الشخصية</h2>
                
                <div class="profile-form">
                  <div class="form-group">
                    <label for="userName">الاسم</label>
                    <input type="text" id="userName" class="form-control" value="${user.name}" placeholder="الاسم الكامل">
                  </div>
                  
                  <div class="form-group">
                    <label for="userPhone">رقم الهاتف</label>
                    <input type="tel" id="userPhone" class="form-control" value="${user.phone || ''}" placeholder="05xxxxxxxx">
                  </div>
                  
                  <div class="form-group">
                    <label for="userEmail">البريد الإلكتروني</label>
                    <input type="email" id="userEmail" class="form-control" value="${user.email || ''}" placeholder="your@email.com">
                  </div>
                  
                  <div class="form-group">
                    <label>حساب تلغرام</label>
                    <div class="readonly-field">
                      <span>${user.telegramId ? '@' + user.username : 'غير مرتبط'}</span>
                      ${!user.telegramId ? '<button class="btn btn-sm btn-outline">ربط حساب تلغرام</button>' : ''}
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button id="updateProfileBtn" class="btn btn-primary">
                      حفظ التغييرات
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- طلباتي -->
              <div class="profile-tab-content ${activeTab === 'orders' ? 'active' : ''}" id="ordersTab">
                <h2>طلباتي السابقة</h2>
                
                ${orderHistory.length > 0 ? `
                  <div class="orders-list">
                    ${orderHistory.map(order => `
                      <div class="order-card">
                        <div class="order-header">
                          <div class="order-info">
                            <h3>طلب #${order._id.toString().slice(-6)}</h3>
                            <span class="order-date">${formatDate(order.createdAt)}</span>
                          </div>
                          <div class="order-status">
                            <span class="status-badge status-${order.status}">
                              ${getStatusInArabic(order.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div class="order-summary">
                          <div class="order-items">
                            <p>${order.items.reduce((total, item) => total + item.quantity, 0)} عناصر</p>
                            <p class="order-items-preview">
                              ${order.items.slice(0, 2).map(item => 
                                `${item.quantity}x ${item.menuItem ? item.menuItem.name : 'عنصر محذوف'}`
                              ).join(', ')}
                              ${order.items.length > 2 ? ` و${order.items.length - 2} عناصر أخرى` : ''}
                            </p>
                          </div>
                          <div class="order-total">
                            <span>${formatCurrency(order.totalPrice)}</span>
                          </div>
                        </div>
                        
                        <div class="order-footer">
                          <a href="/order-tracking?orderId=${order._id}" class="btn btn-sm" data-nav>
                            عرض التفاصيل
                          </a>
                          ${['delivered', 'picked-up'].includes(order.status) ? `
                            <button class="btn btn-sm btn-outline reorder-btn" data-order-id="${order._id}">
                              <i class="icon-refresh"></i> طلب مرة أخرى
                            </button>
                          ` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : `
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="icon-order-empty"></i>
                    </div>
                    <h3>لا توجد طلبات سابقة</h3>
                    <p>لم تقم بإجراء أي طلبات حتى الآن</p>
                    <a href="/menu" class="btn btn-primary" data-nav>استعرض القائمة</a>
                  </div>
                `}
              </div>
              
              <!-- عناويني -->
              <div class="profile-tab-content ${activeTab === 'addresses' ? 'active' : ''}" id="addressesTab">
                <div class="tab-header">
                  <h2>عناويني المحفوظة</h2>
                  <button id="addNewAddressBtn" class="btn btn-sm">
                    <i class="icon-plus"></i> إضافة عنوان جديد
                  </button>
                </div>
                
                <div id="addressesList" class="addresses-list">
                  ${user.addresses && user.addresses.length > 0 ? `
                    ${user.addresses.map((address, index) => `
                      <div class="address-card">
                        <div class="address-card-header">
                          <h3>${address.label}</h3>
                          ${address.isDefault ? '<span class="default-badge">الافتراضي</span>' : ''}
                        </div>
                        <div class="address-card-body">
                          <p>${address.address}</p>
                          ${address.buildingNumber ? `<p>مبنى: ${address.buildingNumber}, شقة: ${address.apartmentNumber || '-'}</p>` : ''}
                        </div>
                        <div class="address-card-footer">
                          ${!address.isDefault ? `
                            <button class="btn btn-sm btn-outline set-default-btn" data-index="${index}">
                              تعيين كافتراضي
                            </button>
                          ` : ''}
                          <button class="btn btn-sm btn-outline edit-address-btn" data-index="${index}">
                            <i class="icon-edit"></i>
                          </button>
                          <button class="btn btn-sm btn-outline delete-address-btn" data-index="${index}">
                            <i class="icon-trash"></i>
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  ` : `
                    <div class="empty-state">
                      <div class="empty-icon">
                        <i class="icon-location-empty"></i>
                      </div>
                      <h3>لا توجد عناوين محفوظة</h3>
                      <p>أضف عناوين التوصيل المفضلة لديك لتسهيل عملية الطلب</p>
                    </div>
                  `}
                </div>
                
                <div id="locationPickerContainer" class="location-picker-wrapper" style="display: none;">
                  <!-- هنا سيتم عرض منتقي الموقع -->
                </div>
              </div>
              
              <!-- برنامج الولاء -->
              <div class="profile-tab-content ${activeTab === 'loyalty' ? 'active' : ''}" id="loyaltyTab">
                <h2>برنامج الولاء</h2>
                
                <!-- معلومات برنامج الولاء -->
                <div class="loyalty-info">
                  <div class="loyalty-header">
                    <div class="loyalty-level">
                      <h3>مستوى العضوية</h3>
                      <div class="level-badge level-${user.membershipLevel || 'bronze'}">
                        ${getMembershipLevelInArabic(user.membershipLevel || 'bronze')}
                      </div>
                    </div>
                    <div class="loyalty-points">
                      <h3>رصيد النقاط</h3>
                      <div class="points-badge">
                        <span>${user.loyaltyPoints || 0}</span> نقطة
                      </div>
                    </div>
                  </div>
                  
                  <!-- تقدم المستوى -->
                  <div class="loyalty-progress">
                    <h3>التقدم للمستوى التالي</h3>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${getLoyaltyProgressPercentage(user)}%"></div>
                    </div>
                    <div class="progress-labels">
                      <span>المستوى الحالي</span>
                      <span>${getPointsToNextLevel(user)} نقطة للمستوى التالي</span>
                    </div>
                  </div>
                  
                  <!-- مزايا المستوى -->
                  <div class="loyalty-benefits">
                    <h3>مزايا المستوى الحالي</h3>
                    <ul class="benefits-list">
                      ${getLoyaltyBenefits(user.membershipLevel || 'bronze').map(benefit => `
                        <li><i class="icon-check"></i> ${benefit}</li>
                      `).join('')}
                    </ul>
                  </div>
                  
                  <!-- كوبونات الخصم المتاحة -->
                  <div class="loyalty-coupons">
                    <h3>كوبونات الخصم المتاحة</h3>
                    <div class="coupons-list">
                      ${getAvailableCoupons(user.membershipLevel || 'bronze').length > 0 ? `
                        ${getAvailableCoupons(user.membershipLevel || 'bronze').map(coupon => `
                          <div class="coupon-card">
                            <div class="coupon-header">
                              <h4>${coupon.title}</h4>
                              <span class="coupon-badge">${coupon.discount}</span>
                            </div>
                            <div class="coupon-body">
                              <p>${coupon.description}</p>
                              <div class="coupon-code">
                                <span>${coupon.code}</span>
                                <button class="copy-code-btn" data-code="${coupon.code}">
                                  <i class="icon-copy"></i>
                                </button>
                              </div>
                            </div>
                            <div class="coupon-footer">
                              <p>صالح حتى: ${formatDate(coupon.expiry)}</p>
                            </div>
                          </div>
                        `).join('')}
                      ` : `
                        <div class="empty-state">
                          <p>لا توجد كوبونات خصم متاحة حالياً</p>
                        </div>
                      `}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- الإشعارات -->
              <div class="profile-tab-content ${activeTab === 'notifications' ? 'active' : ''}" id="notificationsTab">
                <h2>إعدادات الإشعارات</h2>
                
                <div class="notifications-settings">
                  <div class="settings-group">
                    <h3>قنوات الإشعارات</h3>
                    
                    <div class="toggle-setting">
                      <div class="toggle-label">
                        <i class="icon-telegram"></i>
                        <span>إشعارات تلغرام</span>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="telegramNotifications" ${user.notifications?.telegram ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div class="toggle-setting">
                      <div class="toggle-label">
                        <i class="icon-email"></i>
                        <span>البريد الإلكتروني</span>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="emailNotifications" ${user.notifications?.email ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div class="toggle-setting">
                      <div class="toggle-label">
                        <i class="icon-phone"></i>
                        <span>الرسائل النصية</span>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="smsNotifications" ${user.notifications?.sms ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="settings-group">
                    <h3>أنواع الإشعارات</h3>
                    
                    <div class="toggle-setting">
                      <div class="toggle-label">
                        <i class="icon-order"></i>
                        <span>تحديثات الطلبات</span>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="orderNotifications" checked disabled>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    
                    <div class="toggle-setting">
                      <div class="toggle-label">
                        <i class="icon-discount"></i>
                        <span>العروض الخاصة والخصومات</span>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="promoNotifications" ${user.notifications?.promotions ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button id="saveNotificationsBtn" class="btn btn-primary">
                      حفظ الإعدادات
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    `;
    
    // إضافة معالجات الأحداث
    addEventListeners(contentContainer, activeTab);
    
  } catch (error) {
    console.error('خطأ في تحميل صفحة الملف الشخصي:', error);
    contentContainer.innerHTML = `
      <div class="error-container">
        <i class="icon-error"></i>
        <h3>حدث خطأ</h3>
        <p>لم نتمكن من تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.</p>
        <button class="btn btn-primary" id="retryBtn">إعادة المحاولة</button>
      </div>
    `;
    
    // إضافة معالج حدث لزر إعادة المحاولة
    const retryBtn = contentContainer.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        renderProfile(container);
      });
    }
  }
}

// إضافة معالجات الأحداث
function addEventListeners(container, activeTab) {
  // معالجة النقر على روابط التبويب
  const tabLinks = container.querySelectorAll('.profile-nav-item[data-tab]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const tabId = link.getAttribute('data-tab');
      const url = new URL(window.location);
      url.searchParams.set('tab', tabId);
      
      window.history.pushState({}, '', url);
      
      // إعادة تحميل الصفحة
      renderProfile(document.getElementById('app'));
    });
  });
  
  // معالجة تسجيل الخروج
  const logoutBtn = container.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // تأكيد تسجيل الخروج
      if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
        logout();
        router.navigate('/');
      }
    });
  }
  
  // معالجة تحديث الملف الشخصي
  if (activeTab === 'profile') {
    const updateProfileBtn = container.querySelector('#updateProfileBtn');
    if (updateProfileBtn) {
      updateProfileBtn.addEventListener('click', handleUpdateProfile);
    }
  }
  
  // معالجة إضافة عنوان جديد
  if (activeTab === 'addresses') {
    const addNewAddressBtn = container.querySelector('#addNewAddressBtn');
    const locationPickerContainer = container.querySelector('#locationPickerContainer');
    const addressesList = container.querySelector('#addressesList');
    
    if (addNewAddressBtn && locationPickerContainer && addressesList) {
      addNewAddressBtn.addEventListener('click', () => {
        // إخفاء قائمة العناوين وعرض منتقي الموقع
        addressesList.style.display = 'none';
        locationPickerContainer.style.display = 'block';
        
        // عرض منتقي الموقع
        renderLocationPicker(locationPickerContainer, handleNewAddress);
      });
    }
    
    // معالجة أزرار العناوين
    const setDefaultBtns = container.querySelectorAll('.set-default-btn');
    const editAddressBtns = container.querySelectorAll('.edit-address-btn');
    const deleteAddressBtns = container.querySelectorAll('.delete-address-btn');
    
    setDefaultBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        handleSetDefaultAddress(index);
      });
    });
    
    editAddressBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        handleEditAddress(index);
      });
    });
    
    deleteAddressBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        handleDeleteAddress(index);
      });
    });
  }
  
  // معالجة نسخ رموز الكوبونات
  if (activeTab === 'loyalty') {
    const copyCodeBtns = container.querySelectorAll('.copy-code-btn');
    copyCodeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        handleCopyCode(code);
      });
    });
  }
  
  // معالجة حفظ إعدادات الإشعارات
  if (activeTab === 'notifications') {
    const saveNotificationsBtn = container.querySelector('#saveNotificationsBtn');
    if (saveNotificationsBtn) {
      saveNotificationsBtn.addEventListener('click', handleSaveNotifications);
    }
  }
  
  // معالجة إعادة الطلب
  const reorderBtns = container.querySelectorAll('.reorder-btn');
  reorderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-order-id');
      handleReorder(orderId);
    });
  });
}

// معالجة تحديث الملف الشخصي
async function handleUpdateProfile() {
  try {
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!name) {
      showLocalNotification('تنبيه', 'الاسم مطلوب', 'warning');
      return;
    }
    
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري الحفظ', 'يرجى الانتظار...');
    
    // تحديث الملف الشخصي
    const result = await updateUserProfile({ name, phone, email });
    
    if (result.success) {
      showLocalNotification('تم الحفظ', 'تم تحديث الملف الشخصي بنجاح');
      
      // إعادة تحميل الصفحة
      setTimeout(() => {
        renderProfile(document.getElementById('app'));
      }, 1000);
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تحديث الملف الشخصي', 'error');
    }
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تحديث الملف الشخصي', 'error');
  }
}

// معالجة إضافة عنوان جديد
async function handleNewAddress(locationData) {
  try {
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري الحفظ', 'يرجى الانتظار...');
    
    // إضافة العنوان الجديد
    const result = await addAddress({
      label: locationData.label || 'عنوان جديد',
      address: locationData.address,
      coordinates: locationData.coordinates,
      buildingNumber: locationData.buildingNumber,
      floorNumber: locationData.floorNumber,
      apartmentNumber: locationData.apartmentNumber
    });
    
    if (result.success) {
      showLocalNotification('تم الحفظ', 'تم إضافة العنوان الجديد بنجاح');
      
      // إعادة تحميل الصفحة
      setTimeout(() => {
        const url = new URL(window.location);
        url.searchParams.set('tab', 'addresses');
        window.history.pushState({}, '', url);
        renderProfile(document.getElementById('app'));
      }, 1000);
    } else {
      showLocalNotification('خطأ', result.message || 'فشل إضافة العنوان الجديد', 'error');
    }
  } catch (error) {
    console.error('خطأ في إضافة العنوان الجديد:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء إضافة العنوان الجديد', 'error');
  }
}

// معالجة تعيين العنوان الافتراضي
async function handleSetDefaultAddress(index) {
  try {
    // في تطبيق حقيقي، هنا سيتم إرسال طلب لتعيين العنوان كافتراضي
    
    // محاكاة نجاح العملية
    showLocalNotification('تم الحفظ', 'تم تعيين العنوان كافتراضي بنجاح');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      const url = new URL(window.location);
      url.searchParams.set('tab', 'addresses');
      window.history.pushState({}, '', url);
      renderProfile(document.getElementById('app'));
    }, 1000);
  } catch (error) {
    console.error('خطأ في تعيين العنوان الافتراضي:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تعيين العنوان الافتراضي', 'error');
  }
}

// معالجة تحرير العنوان
function handleEditAddress(index) {
  // الحصول على معلومات العنوان المحدد
  const { user } = store.getState().auth;
  const address = user.addresses[index];
  
  if (!address) return;
  
  // إخفاء قائمة العناوين وعرض منتقي الموقع
  const addressesList = document.getElementById('addressesList');
  const locationPickerContainer = document.getElementById('locationPickerContainer');
  
  if (addressesList && locationPickerContainer) {
    addressesList.style.display = 'none';
    locationPickerContainer.style.display = 'block';
    
    // عرض منتقي الموقع مع البيانات الحالية
    renderLocationPicker(locationPickerContainer, handleUpdateAddress, address.coordinates);
  }
}

// معالجة تحديث العنوان
async function handleUpdateAddress(locationData) {
  try {
    // في تطبيق حقيقي، هنا سيتم إرسال طلب لتحديث العنوان
    
    // محاكاة نجاح العملية
    showLocalNotification('تم الحفظ', 'تم تحديث العنوان بنجاح');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      const url = new URL(window.location);
      url.searchParams.set('tab', 'addresses');
      window.history.pushState({}, '', url);
      renderProfile(document.getElementById('app'));
    }, 1000);
  } catch (error) {
    console.error('خطأ في تحديث العنوان:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء تحديث العنوان', 'error');
  }
}

// معالجة حذف العنوان
async function handleDeleteAddress(index) {
  try {
    // تأكيد الحذف
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنوان؟')) {
      return;
    }
    
    // في تطبيق حقيقي، هنا سيتم إرسال طلب لحذف العنوان
    
    // محاكاة نجاح العملية
    showLocalNotification('تم الحذف', 'تم حذف العنوان بنجاح');
    
    // إعادة تحميل الصفحة
    setTimeout(() => {
      const url = new URL(window.location);
      url.searchParams.set('tab', 'addresses');
      window.history.pushState({}, '', url);
      renderProfile(document.getElementById('app'));
    }, 1000);
  } catch (error) {
    console.error('خطأ في حذف العنوان:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء حذف العنوان', 'error');
  }
}

// معالجة نسخ رمز الكوبون
function handleCopyCode(code) {
  // نسخ رمز الكوبون إلى الحافظة
  navigator.clipboard.writeText(code)
    .then(() => {
      showLocalNotification('تم النسخ', 'تم نسخ رمز الكوبون إلى الحافظة');
    })
    .catch(error => {
      console.error('خطأ في نسخ رمز الكوبون:', error);
      showLocalNotification('خطأ', 'فشل نسخ رمز الكوبون', 'error');
    });
}

// معالجة حفظ إعدادات الإشعارات
async function handleSaveNotifications() {
  try {
    const telegramNotifications = document.getElementById('telegramNotifications').checked;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const smsNotifications = document.getElementById('smsNotifications').checked;
    const promoNotifications = document.getElementById('promoNotifications').checked;
    
    // في تطبيق حقيقي، هنا سيتم إرسال طلب لتحديث إعدادات الإشعارات
    
    // محاكاة نجاح العملية
    showLocalNotification('تم الحفظ', 'تم تحديث إعدادات الإشعارات بنجاح');
  } catch (error) {
    console.error('خطأ في حفظ إعدادات الإشعارات:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء حفظ إعدادات الإشعارات', 'error');
  }
}

// معالجة إعادة الطلب
async function handleReorder(orderId) {
  try {
    // في تطبيق حقيقي، هنا سيتم إضافة عناصر الطلب السابق إلى السلة
    
    // محاكاة نجاح العملية
    showLocalNotification('تمت الإضافة', 'تمت إضافة عناصر الطلب إلى السلة');
    
    // التوجيه إلى صفحة السلة
    router.navigate('/cart');
  } catch (error) {
    console.error('خطأ في إعادة الطلب:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء إعادة الطلب', 'error');
  }
}

// دالة لتنسيق التاريخ
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
    'picked-up': 'تم الاستلام',
    'cancelled': 'ملغي'
  };
  
  return statusMap[status] || status;
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

// دالة للحصول على مستوى العضوية بالعربية
function getMembershipLevelInArabic(level) {
  const levelMap = {
    'bronze': 'برونزي',
    'silver': 'فضي',
    'gold': 'ذهبي',
    'platinum': 'بلاتيني'
  };
  
  return levelMap[level] || level;
}

// دالة لحساب النسبة المئوية للتقدم في برنامج الولاء
function getLoyaltyProgressPercentage(user) {
  const totalPoints = user.totalPointsEarned || 0;
  let percentage = 0;
  
  if (user.membershipLevel === 'bronze') {
    // برونزي -> فضي (2000 نقطة)
    percentage = Math.min(100, (totalPoints / 2000) * 100);
  } else if (user.membershipLevel === 'silver') {
    // فضي -> ذهبي (5000 نقطة)
    percentage = Math.min(100, ((totalPoints - 2000) / 3000) * 100);
  } else if (user.membershipLevel === 'gold') {
    // ذهبي -> بلاتيني (10000 نقطة)
    percentage = Math.min(100, ((totalPoints - 5000) / 5000) * 100);
  } else {
    // بلاتيني (أعلى مستوى)
    percentage = 100;
  }
  
  return percentage;
}

// دالة لحساب النقاط المطلوبة للمستوى التالي
function getPointsToNextLevel(user) {
  const totalPoints = user.totalPointsEarned || 0;
  
  if (user.membershipLevel === 'bronze') {
    return Math.max(0, 2000 - totalPoints);
  } else if (user.membershipLevel === 'silver') {
    return Math.max(0, 5000 - totalPoints);
  } else if (user.membershipLevel === 'gold') {
    return Math.max(0, 10000 - totalPoints);
  } else {
    return 0; // بلاتيني (أعلى مستوى)
  }
}

// دالة للحصول على مزايا المستوى
function getLoyaltyBenefits(level) {
  const benefits = {
    'bronze': [
      'نقطة واحدة لكل 10 ريال من المشتريات',
      'تراكم النقاط واستبدالها',
      'إشعارات الطلبات والعروض'
    ],
    'silver': [
      '1.2 نقطة لكل 10 ريال من المشتريات',
      'خصم 5% على طلبات التوصيل',
      'كوبون شهري بخصم 15%',
      'جميع مزايا المستوى البرونزي'
    ],
    'gold': [
      '1.5 نقطة لكل 10 ريال من المشتريات',
      'خصم 10% على طلبات التوصيل',
      'كوبون شهري بخصم 20%',
      'أولوية في تحضير الطلبات',
      'جميع مزايا المستوى الفضي'
    ],
    'platinum': [
      'ضعف النقاط لكل طلب',
      'توصيل مجاني دائمًا',
      'كوبون شهري بخصم 25%',
      'أولوية قصوى في تحضير الطلبات',
      'خدمة عملاء VIP',
      'جميع مزايا المستوى الذهبي'
    ]
  };
  
  return benefits[level] || [];
}

// دالة للحصول على الكوبونات المتاحة
function getAvailableCoupons(level) {
  const coupons = [];
  
  // كوبونات لجميع المستويات
  coupons.push({
    title: 'خصم الطلب الأول',
    code: 'WELCOME10',
    discount: '10%',
    description: 'خصم 10% على طلبك الأول',
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // بعد 30 يوم
  });
  
  // كوبونات حسب المستوى
  if (level === 'silver' || level === 'gold' || level === 'platinum') {
    coupons.push({
      title: 'خصم المستوى الفضي',
      code: 'SILVER15',
      discount: '15%',
      description: 'خصم 15% على طلبك التالي',
      expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // بعد 15 يوم
    });
  }
  
  if (level === 'gold' || level === 'platinum') {
    coupons.push({
      title: 'خصم المستوى الذهبي',
      code: 'GOLD20',
      discount: '20%',
      description: 'خصم 20% على طلبك التالي',
      expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // بعد 15 يوم
    });
  }
  
  if (level === 'platinum') {
    coupons.push({
      title: 'خصم المستوى البلاتيني',
      code: 'PLATINUM25',
      discount: '25%',
      description: 'خصم 25% على طلبك التالي',
      expiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // بعد 15 يوم
    });
  }
  
  return coupons;
}