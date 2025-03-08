import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { loginWithTelegram, loginAdmin, loginKitchen } from '../../js/api.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';

// دالة عرض صفحة المصادقة
export function renderAuth(container) {
  // التحقق من حالة المصادقة
  const { isAuthenticated } = store.getState().auth;
  
  // إذا كان المستخدم مسجلاً بالفعل، توجيهه للصفحة الرئيسية
  if (isAuthenticated) {
    router.navigate('/');
    return;
  }
  
  // الحصول على معلمات URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('redirect');
  
  // حفظ مسار إعادة التوجيه (إن وجد)
  if (redirectPath) {
    store.updateState('auth.redirectAfterLogin', redirectPath);
  }
  
  // عرض تخطيط الصفحة
  const contentContainer = renderMainLayout(container);
  
  // عرض محتوى صفحة المصادقة
  contentContainer.innerHTML = `
    <section class="auth-page section-padding">
      <div class="container">
        <div class="auth-container">
          <div class="auth-header">
            <h1>تسجيل الدخول</h1>
            <p>مرحباً بك في بيت المحاشي! سجل دخولك للاستمتاع بتجربة طلب مميزة</p>
          </div>
          
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="customer">العملاء</button>
            <button class="auth-tab" data-tab="admin">المشرفين</button>
            <button class="auth-tab" data-tab="kitchen">المطبخ</button>
          </div>
          
          <!-- قسم مصادقة العملاء -->
          <div class="auth-tab-content active" id="customerTab">
            <div class="auth-methods">
              <div class="auth-method">
                <div class="auth-method-header">
                  <h3>تسجيل الدخول بواسطة تلغرام</h3>
                  <p>الطريقة الأسرع والأكثر أماناً للتسجيل</p>
                </div>
                
                <div class="telegram-login-container">
                  <div id="telegramLoginButton"></div>
                  <p class="disclaimer">سنستخدم معرف تلغرام الخاص بك لتسجيل الدخول والتواصل معك بخصوص طلباتك فقط.</p>
                </div>
              </div>
              
              <div class="auth-separator">
                <span>أو</span>
              </div>
              
              <div class="auth-method">
                <div class="auth-method-header">
                  <h3>استمر كضيف</h3>
                  <p>بدون تسجيل دخول، ولكن مع تجربة محدودة</p>
                </div>
                
                <div class="guest-login">
                  <p>يمكنك تصفح القائمة وإضافة العناصر إلى سلة المشتريات كضيف، ولكن لإتمام الطلب ستحتاج إلى تسجيل الدخول.</p>
                  <a href="/menu" class="btn btn-outline" data-nav>تصفح كضيف</a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- قسم مصادقة المشرفين -->
          <div class="auth-tab-content" id="adminTab">
            <div class="admin-login-form">
              <div class="form-group">
                <label for="adminUsername">اسم المستخدم</label>
                <input type="text" id="adminUsername" class="form-control" placeholder="أدخل اسم المستخدم">
              </div>
              
              <div class="form-group">
                <label for="adminPassword">كلمة المرور</label>
                <div class="password-input-group">
                  <input type="password" id="adminPassword" class="form-control" placeholder="أدخل كلمة المرور">
                  <button type="button" class="toggle-password-btn" id="adminTogglePassword">
                    <i class="icon-eye"></i>
                  </button>
                </div>
              </div>
              
              <div class="form-actions">
                <button id="adminLoginBtn" class="btn btn-primary btn-block">
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
          
          <!-- قسم مصادقة المطبخ -->
          <div class="auth-tab-content" id="kitchenTab">
            <div class="kitchen-login-form">
              <div class="form-group">
                <label for="kitchenUsername">اسم المستخدم</label>
                <input type="text" id="kitchenUsername" class="form-control" placeholder="أدخل اسم المستخدم">
              </div>
              
              <div class="form-group">
                <label for="kitchenPassword">كلمة المرور</label>
                <div class="password-input-group">
                  <input type="password" id="kitchenPassword" class="form-control" placeholder="أدخل كلمة المرور">
                  <button type="button" class="toggle-password-btn" id="kitchenTogglePassword">
                    <i class="icon-eye"></i>
                  </button>
                </div>
              </div>
              
              <div class="form-actions">
                <button id="kitchenLoginBtn" class="btn btn-primary btn-block">
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  
  // تهيئة زر تسجيل دخول تلغرام
  initTelegramLoginButton();
  
  // إضافة معالجات الأحداث
  addEventListeners(contentContainer);
}

// تهيئة زر تسجيل دخول تلغرام
function initTelegramLoginButton() {
  // في تطبيق حقيقي، سيتم استخدام زر تسجيل دخول تلغرام الرسمي
  // هنا نستخدم محاكاة للزر
  
  const telegramLoginButton = document.getElementById('telegramLoginButton');
  if (telegramLoginButton) {
    telegramLoginButton.innerHTML = `
      <button id="mockTelegramLoginBtn" class="btn telegram-login-btn">
        <i class="icon-telegram"></i> تسجيل الدخول بواسطة تلغرام
      </button>
    `;
  }
}

// إضافة معالجات الأحداث
function addEventListeners(container) {
  // التبديل بين علامات التبويب
  const authTabs = container.querySelectorAll('.auth-tab');
  const tabContents = container.querySelectorAll('.auth-tab-content');
  
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // إزالة الفئة النشطة من جميع العلامات والمحتويات
      authTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // إضافة الفئة النشطة للعلامة المحددة
      tab.classList.add('active');
      
      // عرض المحتوى المرتبط بالعلامة
      const tabId = tab.getAttribute('data-tab');
      const tabContent = container.querySelector(`#${tabId}Tab`);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
  
  // زر تسجيل دخول تلغرام
  const mockTelegramLoginBtn = container.querySelector('#mockTelegramLoginBtn');
  if (mockTelegramLoginBtn) {
    mockTelegramLoginBtn.addEventListener('click', handleTelegramLogin);
  }
  
  // زر تسجيل دخول المشرف
  const adminLoginBtn = container.querySelector('#adminLoginBtn');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', handleAdminLogin);
  }
  
  // زر تسجيل دخول المطبخ
  const kitchenLoginBtn = container.querySelector('#kitchenLoginBtn');
  if (kitchenLoginBtn) {
    kitchenLoginBtn.addEventListener('click', handleKitchenLogin);
  }
  
  // أزرار إظهار/إخفاء كلمة المرور
  const adminTogglePassword = container.querySelector('#adminTogglePassword');
  if (adminTogglePassword) {
    adminTogglePassword.addEventListener('click', () => {
      togglePasswordVisibility('adminPassword', adminTogglePassword);
    });
  }
  
  const kitchenTogglePassword = container.querySelector('#kitchenTogglePassword');
  if (kitchenTogglePassword) {
    kitchenTogglePassword.addEventListener('click', () => {
      togglePasswordVisibility('kitchenPassword', kitchenTogglePassword);
    });
  }
}

// تبديل رؤية كلمة المرور
function togglePasswordVisibility(inputId, button) {
  const passwordInput = document.getElementById(inputId);
  const icon = button.querySelector('i');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.className = 'icon-eye-off';
  } else {
    passwordInput.type = 'password';
    icon.className = 'icon-eye';
  }
}

// معالجة تسجيل دخول تلغرام
async function handleTelegramLogin() {
  try {
    // في تطبيق حقيقي، ستأتي هذه البيانات من زر تلغرام الرسمي
    // هنا نستخدم بيانات وهمية للاختبار
    const mockTelegramData = {
      id: '123456789',
      first_name: 'محمد',
      last_name: 'أحمد',
      username: 'mohammed_ahmed',
      photo_url: 'https://t.me/i/userpic/320/mohammed_ahmed.jpg',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'mock_hash'
    };
    
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري تسجيل الدخول', 'يرجى الانتظار...');
    
    // تسجيل الدخول باستخدام بيانات تلغرام
    const result = await loginWithTelegram(mockTelegramData);
    
    if (result.success) {
      showLocalNotification('تم تسجيل الدخول', 'تم تسجيل دخولك بنجاح!');
      
      // التوجيه إلى الصفحة المطلوبة بعد تسجيل الدخول
      const redirectPath = store.getState().auth.redirectAfterLogin || '/';
      router.navigate(redirectPath);
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تسجيل الدخول', 'error');
    }
  } catch (error) {
    console.error('خطأ في تسجيل دخول تلغرام:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
  }
}

// معالجة تسجيل دخول المشرف
async function handleAdminLogin() {
  try {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
      showLocalNotification('تنبيه', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
      return;
    }
    
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري تسجيل الدخول', 'يرجى الانتظار...');
    
    // تسجيل الدخول كمشرف
    const result = await loginAdmin({ username, password });
    
    if (result.success) {
      showLocalNotification('تم تسجيل الدخول', 'تم تسجيل دخولك بنجاح!');
      
      // التوجيه إلى لوحة التحكم
      router.navigate('/admin');
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تسجيل الدخول', 'error');
    }
  } catch (error) {
    console.error('خطأ في تسجيل دخول المشرف:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
  }
}

// معالجة تسجيل دخول المطبخ
async function handleKitchenLogin() {
  try {
    const username = document.getElementById('kitchenUsername').value.trim();
    const password = document.getElementById('kitchenPassword').value;
    
    if (!username || !password) {
      showLocalNotification('تنبيه', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
      return;
    }
    
    // إظهار تنبيه بالانتظار
    showLocalNotification('جاري تسجيل الدخول', 'يرجى الانتظار...');
    
    // تسجيل الدخول كموظف مطبخ
    const result = await loginKitchen({ username, password });
    
    if (result.success) {
      showLocalNotification('تم تسجيل الدخول', 'تم تسجيل دخولك بنجاح!');
      
      // التوجيه إلى لوحة المطبخ
      router.navigate('/kitchen');
    } else {
      showLocalNotification('خطأ', result.message || 'فشل تسجيل الدخول', 'error');
    }
  } catch (error) {
    console.error('خطأ في تسجيل دخول المطبخ:', error);
    showLocalNotification('خطأ', 'حدث خطأ أثناء محاولة تسجيل الدخول', 'error');
  }
}