import { store } from '../../js/store.js';
import { router } from '../../js/router.js';
import { logout } from '../../js/api.js';

export function renderHeader(container) {
  const { isAuthenticated, user } = store.getState().auth;
  
  container.innerHTML = `
    <div class="container">
      <div class="header-content">
        <div class="logo">
          <a href="/" data-nav>
            <img src="/assets/images/logo/logo-full.png" alt="بيت المحاشي">
          </a>
        </div>
        
        <nav class="main-nav desktop-only">
          <ul>
            <li><a href="/" data-nav class="${router.getCurrentPath() === '/' ? 'active' : ''}">الرئيسية</a></li>
            <li><a href="/menu" data-nav class="${router.getCurrentPath() === '/menu' ? 'active' : ''}">القائمة</a></li>
            <li><a href="/cart" data-nav class="${router.getCurrentPath() === '/cart' ? 'active' : ''}">
              السلة <span class="cart-count" id="headerCartCount">0</span>
            </a></li>
            ${isAuthenticated ? `
              <li><a href="/profile" data-nav class="${router.getCurrentPath() === '/profile' ? 'active' : ''}">حسابي</a></li>
              ${user && user.isAdmin ? `
                <li><a href="/admin" data-nav>لوحة التحكم</a></li>
              ` : ''}
              ${user && (user.isKitchenStaff || user.isAdmin) ? `
                <li><a href="/kitchen" data-nav>المطبخ</a></li>
              ` : ''}
            ` : `
              <li><a href="/auth" data-nav class="${router.getCurrentPath() === '/auth' ? 'active' : ''}">تسجيل الدخول</a></li>
            `}
          </ul>
        </nav>
        
        <div class="header-actions desktop-only">
          ${isAuthenticated ? `
            <div class="user-menu">
              <div class="user-menu-trigger">
                <img src="${user && user.avatar ? user.avatar : '/assets/images/ui/user-avatar.png'}" alt="الملف الشخصي" class="user-avatar">
                <span>${user ? user.name.split(' ')[0] : 'المستخدم'}</span>
                <i class="icon-chevron-down"></i>
              </div>
              <div class="user-menu-dropdown">
                <a href="/profile" data-nav>
                  <i class="icon-user"></i> الملف الشخصي
                </a>
                <a href="/profile/orders" data-nav>
                  <i class="icon-order"></i> طلباتي
                </a>
                <a href="#" id="logoutBtn">
                  <i class="icon-logout"></i> تسجيل الخروج
                </a>
              </div>
            </div>
          ` : `
            <a href="/auth" class="btn btn-primary" data-nav>تسجيل الدخول</a>
          `}
        </div>
        
        <button class="menu-toggle mobile-only" id="menuToggle">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
    
    <!-- القائمة الجانبية للجوال -->
    <div class="mobile-sidebar" id="mobileSidebar">
      <div class="mobile-sidebar-header">
        <img src="/assets/images/logo/logo-full.png" alt="بيت المحاشي">
        <button class="close-sidebar" id="closeSidebar">&times;</button>
      </div>
      
      <div class="mobile-user-info">
        ${isAuthenticated ? `
          <img src="${user && user.avatar ? user.avatar : '/assets/images/ui/user-avatar.png'}" alt="الملف الشخصي" class="user-avatar">
          <h3>${user ? user.name : 'المستخدم'}</h3>
        ` : `
          <a href="/auth" class="btn btn-primary" data-nav>تسجيل الدخول</a>
        `}
      </div>
      
      <nav class="mobile-sidebar-nav">
        <ul>
          <li><a href="/" data-nav class="${router.getCurrentPath() === '/' ? 'active' : ''}">
            <i class="icon-home"></i> الرئيسية
          </a></li>
          <li><a href="/menu" data-nav class="${router.getCurrentPath() === '/menu' ? 'active' : ''}">
            <i class="icon-menu"></i> القائمة
          </a></li>
          <li><a href="/cart" data-nav class="${router.getCurrentPath() === '/cart' ? 'active' : ''}">
            <i class="icon-cart"></i> السلة <span class="cart-count" id="sidebarCartCount">0</span>
          </a></li>
          ${isAuthenticated ? `
            <li><a href="/profile" data-nav class="${router.getCurrentPath() === '/profile' ? 'active' : ''}">
              <i class="icon-user"></i> حسابي
            </a></li>
            <li><a href="/profile/orders" data-nav class="${router.getCurrentPath() === '/profile/orders' ? 'active' : ''}">
              <i class="icon-order"></i> طلباتي
            </a></li>
            ${user && user.isAdmin ? `
              <li><a href="/admin" data-nav>
                <i class="icon-admin"></i> لوحة التحكم
              </a></li>
            ` : ''}
            ${user && (user.isKitchenStaff || user.isAdmin) ? `
              <li><a href="/kitchen" data-nav>
                <i class="icon-kitchen"></i> المطبخ
              </a></li>
            ` : ''}
            <li><a href="#" id="mobileSidebarLogoutBtn">
              <i class="icon-logout"></i> تسجيل الخروج
            </a></li>
          ` : `
            <li><a href="/auth" data-nav class="${router.getCurrentPath() === '/auth' ? 'active' : ''}">
              <i class="icon-login"></i> تسجيل الدخول
            </a></li>
          `}
        </ul>
      </nav>
    </div>
  `;
  
  // تحديث عدد العناصر في السلة
  updateCartCount();
  
  // معالجة النقر على زر تسجيل الخروج
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // معالجة النقر على زر تسجيل الخروج في القائمة الجانبية
  const mobileSidebarLogoutBtn = document.getElementById('mobileSidebarLogoutBtn');
  if (mobileSidebarLogoutBtn) {
    mobileSidebarLogoutBtn.addEventListener('click', handleLogout);
  }
  
  // معالجة فتح/إغلاق القائمة المنسدلة للمستخدم
  const userMenuTrigger = container.querySelector('.user-menu-trigger');
  if (userMenuTrigger) {
    userMenuTrigger.addEventListener('click', toggleUserMenu);
  }
  
  // معالجة فتح/إغلاق القائمة الجانبية للجوال
  const menuToggle = document.getElementById('menuToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  const mobileSidebar = document.getElementById('mobileSidebar');
  
  if (menuToggle && closeSidebar && mobileSidebar) {
    menuToggle.addEventListener('click', () => {
      mobileSidebar.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    closeSidebar.addEventListener('click', () => {
      mobileSidebar.classList.remove('active');
      document.body.style.overflow = '';
    });
    
    // إغلاق القائمة الجانبية عند النقر على رابط
    mobileSidebar.querySelectorAll('a[data-nav]').forEach(link => {
      link.addEventListener('click', () => {
        mobileSidebar.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
    
    // إغلاق القائمة الجانبية عند النقر خارجها
    document.addEventListener('click', (event) => {
      if (mobileSidebar.classList.contains('active') && 
          !mobileSidebar.contains(event.target) && 
          !menuToggle.contains(event.target)) {
        mobileSidebar.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  
  // الاشتراك في تغييرات المتجر لتحديث عدد العناصر في السلة
  store.subscribe(() => {
    updateCartCount();
  });
}

// دالة لتبديل القائمة المنسدلة للمستخدم
function toggleUserMenu() {
  const userMenuDropdown = document.querySelector('.user-menu-dropdown');
  userMenuDropdown.classList.toggle('active');
  
  // إغلاق القائمة عند النقر خارجها
  document.addEventListener('click', function closeUserMenu(event) {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(event.target)) {
      userMenuDropdown.classList.remove('active');
      document.removeEventListener('click', closeUserMenu);
    }
  });
}

// دالة لتحديث عدد العناصر في السلة
function updateCartCount() {
  const cartCount = store.getCartItemsCount();
  
  // تحديث عدد العناصر في رأس الصفحة
  const headerCartCount = document.getElementById('headerCartCount');
  if (headerCartCount) {
    headerCartCount.textContent = cartCount;
    
    if (cartCount > 0) {
      headerCartCount.style.display = 'inline-block';
    } else {
      headerCartCount.style.display = 'none';
    }
  }
  
  // تحديث عدد العناصر في القائمة الجانبية
  const sidebarCartCount = document.getElementById('sidebarCartCount');
  if (sidebarCartCount) {
    sidebarCartCount.textContent = cartCount;
    
    if (cartCount > 0) {
      sidebarCartCount.style.display = 'inline-block';
    } else {
      sidebarCartCount.style.display = 'none';
    }
  }
}

// دالة لمعالجة تسجيل الخروج
function handleLogout(event) {
  event.preventDefault();
  
  logout();
  router.navigate('/');
}