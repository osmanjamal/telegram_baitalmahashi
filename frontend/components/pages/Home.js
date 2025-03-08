import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { getFeaturedItems, getCategories } from '../../js/api.js';
import { router } from '../../js/router.js';
import { showLocalNotification } from '../../js/notifications.js';

// دالة عرض الصفحة الرئيسية
export async function renderHome(container) {
  // عرض تخطيط الصفحة الرئيسية مع شاشة تحميل
  const contentContainer = renderMainLayout(container, '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>');
  
  try {
    // جلب البيانات اللازمة للصفحة الرئيسية
    await Promise.all([
      getFeaturedItems(),
      getCategories()
    ]);
    
    // الحصول على البيانات من المخزن
    const { featuredItems } = store.getState().menu;
    const { categories } = store.getState().menu;
    
    // إنشاء محتوى الصفحة الرئيسية
    const homeContent = `
      <!-- البانر الرئيسي -->
      <section class="hero-section">
        <div class="hero-slider">
          <div class="hero-slide">
            <img src="/assets/images/banners/home-banner-1.jpg" alt="بيت المحاشي" class="hero-image">
            <div class="hero-content">
              <h1>أشهى المحاشي الشرقية</h1>
              <p>تذوق ألذ وأشهى المحاشي المحضرة بأجود المكونات الطازجة وبأيدي أمهر الطهاة</p>
              <a href="/menu" class="btn btn-primary" data-nav>استعرض القائمة</a>
            </div>
          </div>
        </div>
      </section>
      
      <!-- فئات الطعام -->
      <section class="categories-section section-padding">
        <div class="container">
          <div class="section-header">
            <h2>اكتشف فئات طعامنا</h2>
            <p>اختر من بين مجموعة متنوعة من أطباق المحاشي الشهية</p>
          </div>
          
          <div class="category-grid">
            ${categories.map(category => `
              <a href="/menu?category=${category._id}" class="category-card" data-category="${category._id}" data-nav>
                <div class="category-card-image">
                  <img src="${category.image || `/assets/icons/category-icons/menu.svg`}" alt="${category.name}">
                </div>
                <h3>${category.name}</h3>
              </a>
            `).join('')}
          </div>
        </div>
      </section>
      
      <!-- الأطباق المميزة -->
      <section class="featured-section section-padding">
        <div class="container">
          <div class="section-header">
            <h2>الأطباق المميزة</h2>
            <p>جرب أشهر أطباقنا التي ينصح بها الزبائن</p>
            <a href="/menu" class="btn btn-outline" data-nav>عرض القائمة كاملة</a>
          </div>
          
          <div class="featured-items">
            ${featuredItems.slice(0, 4).map(item => `
              <div class="featured-item">
                <div class="featured-item-image">
                  <img src="${item.image || '/assets/images/ui/placeholder.png'}" alt="${item.name}">
                  ${!item.available ? '<div class="not-available-badge">غير متوفر</div>' : ''}
                </div>
                <div class="featured-item-content">
                  <h3>${item.name}</h3>
                  <p>${item.description}</p>
                  <div class="featured-item-footer">
                    <span class="price">${formatCurrency(item.price)}</span>
                    ${item.available ? `
                      <button class="btn btn-sm add-to-cart-btn" data-id="${item._id}">
                        أضف للسلة
                      </button>
                    ` : `
                      <button class="btn btn-sm disabled">
                        غير متوفر
                      </button>
                    `}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      
      <!-- بانر الخصم -->
      <section class="promo-section">
        <div class="container">
          <div class="promo-banner">
            <div class="promo-content">
              <h2>خصم 15% على جميع طلبات العائلات</h2>
              <p>استمتع بخصم 15% على جميع وجبات العائلة عند استخدام كود الخصم</p>
              <div class="promo-code">FAMILY15</div>
              <a href="/menu" class="btn btn-primary" data-nav>اطلب الآن</a>
            </div>
            <div class="promo-image">
              <img src="/assets/images/banners/promo-banner.jpg" alt="عرض خاص">
            </div>
          </div>
        </div>
      </section>
      
      <!-- مميزات التطبيق -->
      <section class="features-section section-padding">
        <div class="container">
          <div class="section-header">
            <h2>لماذا تختار بيت المحاشي؟</h2>
            <p>نحن نقدم أفضل تجربة لعشاق المحاشي</p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="icon-quality"></i>
              </div>
              <h3>جودة عالية</h3>
              <p>نستخدم فقط أجود وأطزج المكونات في تحضير أطباقنا</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="icon-delivery"></i>
              </div>
              <h3>توصيل سريع</h3>
              <p>نوصل طلبك إلى باب منزلك في أسرع وقت ممكن</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="icon-menu"></i>
              </div>
              <h3>قائمة متنوعة</h3>
              <p>اختر من بين مجموعة واسعة من أطباق المحاشي المتنوعة</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">
                <i class="icon-hygiene"></i>
              </div>
              <h3>نظافة تامة</h3>
              <p>نلتزم بأعلى معايير النظافة والتعقيم في إعداد الطعام</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- الشهادات والآراء -->
      <section class="testimonials-section section-padding">
        <div class="container">
          <div class="section-header">
            <h2>آراء عملائنا</h2>
            <p>ماذا يقول عملاؤنا عن تجربتهم معنا</p>
          </div>
          
          <div class="testimonials-slider">
            <div class="testimonial">
              <div class="testimonial-content">
                <p>"أفضل محاشي تذوقتها على الإطلاق! المكونات طازجة والنكهات رائعة. سأطلب مجدداً بالتأكيد."</p>
              </div>
              <div class="testimonial-author">
                <img src="/assets/images/ui/user-avatar.png" alt="أحمد محمد" class="testimonial-avatar">
                <div class="testimonial-info">
                  <h4>أحمد محمد</h4>
                  <div class="rating">
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="testimonial">
              <div class="testimonial-content">
                <p>"توصيل سريع وطعام ساخن ولذيذ. محشي الكوسة والباذنجان من أفضل ما تذوقت!"</p>
              </div>
              <div class="testimonial-author">
                <img src="/assets/images/ui/user-avatar.png" alt="سارة علي" class="testimonial-avatar">
                <div class="testimonial-info">
                  <h4>سارة علي</h4>
                  <div class="rating">
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star-half"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="testimonial">
              <div class="testimonial-content">
                <p>"تطبيق سهل الاستخدام وخدمة عملاء ممتازة. الطعام شهي ويصل دائماً في الوقت المحدد."</p>
              </div>
              <div class="testimonial-author">
                <img src="/assets/images/ui/user-avatar.png" alt="محمد خالد" class="testimonial-avatar">
                <div class="testimonial-info">
                  <h4>محمد خالد</h4>
                  <div class="rating">
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                    <i class="icon-star"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- تحميل التطبيق -->
      <section class="app-section section-padding">
        <div class="container">
          <div class="app-banner">
            <div class="app-content">
              <h2>حمّل تطبيق بيت المحاشي الآن</h2>
              <p>اطلب ألذ أطباق المحاشي مباشرة من هاتفك في أي وقت ومن أي مكان</p>
              <div class="app-buttons">
                <a href="#" class="app-button">
                  <img src="/assets/icons/app-store.svg" alt="App Store">
                </a>
                <a href="#" class="app-button">
                  <img src="/assets/icons/google-play.svg" alt="Google Play">
                </a>
              </div>
            </div>
            <div class="app-image">
              <img src="/assets/images/ui/app-mockup.png" alt="تطبيق بيت المحاشي">
            </div>
          </div>
        </div>
      </section>
    `;
    
    // عرض المحتوى
    contentContainer.innerHTML = homeContent;
    
    // إضافة معالجات الأحداث
    addEventListeners(contentContainer);
    
  } catch (error) {
    console.error('خطأ في تحميل الصفحة الرئيسية:', error);
    contentContainer.innerHTML = `
      <div class="error-container">
        <i class="icon-error"></i>
        <h3>حدث خطأ</h3>
        <p>لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
        <button class="btn btn-primary" id="retryBtn">إعادة المحاولة</button>
      </div>
    `;
    
    // إضافة معالج حدث لزر إعادة المحاولة
    const retryBtn = contentContainer.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        renderHome(container);
      });
    }
  }
}

// إضافة معالجات الأحداث للصفحة الرئيسية
function addEventListeners(container) {
  // معالجة النقر على زر الإضافة للسلة
  const addToCartButtons = container.querySelectorAll('.add-to-cart-btn');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const itemId = button.getAttribute('data-id');
      
      try {
        // جلب بيانات المنتج
        const { featuredItems } = store.getState().menu;
        const item = featuredItems.find(item => item._id === itemId);
        
        if (item) {
          // إضافة العنصر للسلة
          store.addToCart({
            id: item._id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
          });
          
          // عرض إشعار نجاح الإضافة
          showLocalNotification('تمت الإضافة للسلة', `تمت إضافة ${item.name} إلى سلة المشتريات`);
        }
      } catch (error) {
        console.error('خطأ في إضافة العنصر للسلة:', error);
        showLocalNotification('خطأ', 'حدث خطأ أثناء إضافة العنصر للسلة');
      }
    });
  });
}

// دالة لتنسيق المبلغ كعملة
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}