import { store } from './store.js';
import { renderHome } from '../components/pages/Home.js';
import { renderMenu } from '../components/pages/Menu.js';
import { renderCart } from '../components/pages/Cart.js';
import { renderCheckout } from '../components/pages/Checkout.js';
import { renderProfile } from '../components/pages/Profile.js';
import { renderOrderTracking } from '../components/pages/OrderTracking.js';
import { renderAuth } from '../components/pages/Auth.js';
import { renderKitchenDashboard } from '../components/layouts/KitchenLayout.js';
import { renderAdminDashboard } from '../components/layouts/AdminLayout.js';

// تعريف التوجيه
class Router {
  constructor() {
    this.routes = {
      '/': { render: renderHome, auth: false },
      '/menu': { render: renderMenu, auth: false },
      '/cart': { render: renderCart, auth: false },
      '/checkout': { render: renderCheckout, auth: true },
      '/profile': { render: renderProfile, auth: true },
      '/order-tracking': { render: renderOrderTracking, auth: true },
      '/auth': { render: renderAuth, auth: false },
      '/kitchen': { render: renderKitchenDashboard, auth: true, role: 'kitchen' },
      '/admin': { render: renderAdminDashboard, auth: true, role: 'admin' }
    };
    
    this.notFoundCallback = () => {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="container text-center" style="padding-top: 100px;">
          <h1>404</h1>
          <h2>الصفحة غير موجودة</h2>
          <p>عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
          <a href="/" class="btn btn-primary" data-nav>العودة للصفحة الرئيسية</a>
        </div>
      `;
    };
    
    this.currentPath = window.location.pathname;
  }
  
  // تهيئة التوجيه
  init() {
    // معالجة التنقل بين الصفحات
    window.addEventListener('popstate', (e) => {
      this.navigate(window.location.pathname);
    });
    
    // معالجة النقر على الروابط
    document.addEventListener('click', (e) => {
      // التحقق من وجود خاصية data-nav
      if (e.target.matches('[data-nav], [data-nav] *')) {
        e.preventDefault();
        
        // الحصول على الرابط
        let targetElement = e.target;
        
        // إذا كان العنصر المنقور عليه فرعي، ابحث عن العنصر الأب بخاصية data-nav
        while (targetElement && !targetElement.hasAttribute('data-nav')) {
          targetElement = targetElement.parentElement;
        }
        
        if (targetElement) {
          const href = targetElement.getAttribute('href');
          if (href) {
            this.navigate(href);
          }
        }
      }
    });
    
    // التوجيه إلى المسار الحالي
    this.navigate(window.location.pathname);
  }
  
  // التنقل إلى مسار
  navigate(path) {
    const route = this.routes[path];
    
    if (!route) {
      this.notFoundCallback();
      return;
    }
    
    // التحقق من المصادقة
    if (route.auth && !store.getState().auth.isAuthenticated) {
      // تخزين المسار المطلوب للرجوع إليه بعد المصادقة
      store.setState({
        auth: {
          ...store.getState().auth,
          redirectAfterLogin: path
        }
      });
      
      // التوجيه إلى صفحة المصادقة
      history.pushState(null, '', '/auth');
      this.renderRoute('/auth');
      return;
    }
    
    // التحقق من الدور
    if (route.role) {
      const userRole = store.getState().auth.user?.role;
      if (!userRole || (route.role === 'admin' && userRole !== 'admin') || 
          (route.role === 'kitchen' && userRole !== 'kitchen' && userRole !== 'admin')) {
        // التوجيه إلى الصفحة الرئيسية إذا لم يكن لدى المستخدم الصلاحيات المطلوبة
        history.pushState(null, '', '/');
        this.renderRoute('/');
        return;
      }
    }
    
    // تحديث عنوان الصفحة
    history.pushState(null, '', path);
    this.currentPath = path;
    
    // عرض الصفحة
    this.renderRoute(path);
    
    // التمرير إلى أعلى الصفحة
    window.scrollTo(0, 0);
    
    // تحديث الروابط النشطة
    this.updateActiveLinks();
  }
  
  // عرض المسار
  renderRoute(path) {
    const route = this.routes[path];
    if (route) {
      const app = document.getElementById('app');
      route.render(app);
    } else {
      this.notFoundCallback();
    }
  }
  
  // تحديث الروابط النشطة
  updateActiveLinks() {
    // إزالة الفئة النشطة من جميع الروابط
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.remove('active');
    });
    
    // إضافة الفئة النشطة للرابط الحالي
    document.querySelectorAll(`[data-nav][href="${this.currentPath}"]`).forEach(link => {
      link.classList.add('active');
    });
    
    // تحديث شريط التنقل السفلي
    document.querySelectorAll('.mobile-nav .nav-item').forEach(link => {
      link.classList.remove('active');
    });
    
    document.querySelectorAll(`.mobile-nav .nav-item[href="${this.currentPath}"]`).forEach(link => {
      link.classList.add('active');
    });
  }
  
  // الحصول على المسار الحالي
  getCurrentPath() {
    return this.currentPath;
  }
}

// إنشاء كائن التوجيه
export const router = new Router();