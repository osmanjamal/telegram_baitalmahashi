import { store } from '../../js/store.js';
import { renderMainLayout } from '../layouts/MainLayout.js';
import { getCategories, getMenuItemsByCategory } from '../../js/api.js';
import { renderMenuCard } from '../shared/MenuCard.js';
import { showLocalNotification } from '../../js/notifications.js';

// دالة عرض صفحة القائمة
export async function renderMenu(container) {
  // عرض تخطيط الصفحة مع شاشة تحميل
  const contentContainer = renderMainLayout(container, '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>');

  try {
    // جلب الفئات
    await getCategories();
    
    // الحصول على الفئات من المخزن
    const { categories } = store.getState().menu;
    
    // الحصول على معرف الفئة المحددة من عنوان URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategoryId = urlParams.get('category') || (categories[0] ? categories[0]._id : null);
    
    // إذا كان هناك فئات ومعرف فئة محدد، اجلب عناصر تلك الفئة
    if (categories.length > 0 && selectedCategoryId) {
      // عرض قالب الصفحة الأساسي
      contentContainer.innerHTML = `
        <section class="menu-page section-padding">
          <div class="container">
            <div class="section-header">
              <h1>قائمة الطعام</h1>
              <p>استمتع بتشكيلة واسعة من أشهى أطباق المحاشي الشرقية</p>
            </div>
            
            <!-- تصفية القائمة -->
            <div class="menu-filter">
              <div class="categories-tabs" id="categoriesTabs">
                ${categories.map(category => `
                  <a href="?category=${category._id}" 
                     class="category-tab ${category._id === selectedCategoryId ? 'active' : ''}" 
                     data-category="${category._id}">
                    ${category.name}
                  </a>
                `).join('')}
              </div>
              
              <div class="search-filter">
                <input type="text" id="menuSearch" class="search-input" placeholder="ابحث في القائمة...">
                <button id="searchBtn" class="search-btn">
                  <i class="icon-search"></i>
                </button>
              </div>
            </div>
            
            <!-- عناصر القائمة -->
            <div class="menu-items-container">
              <div class="loading-spinner" id="menuItemsLoading"></div>
              <div class="menu-grid" id="menuGrid"></div>
              <div class="no-items" id="noItems" style="display: none;">
                <p>لا توجد عناصر في هذه الفئة.</p>
              </div>
            </div>
          </div>
        </section>
      `;
      
      // إضافة معالجات الأحداث
      addEventListeners(contentContainer, selectedCategoryId);
      
      // تحميل عناصر الفئة المحددة
      loadCategoryItems(selectedCategoryId);
    } else {
      // لا توجد فئات
      contentContainer.innerHTML = `
        <section class="menu-page section-padding">
          <div class="container">
            <div class="section-header">
              <h1>قائمة الطعام</h1>
              <p>استمتع بتشكيلة واسعة من أشهى أطباق المحاشي الشرقية</p>
            </div>
            
            <div class="empty-state">
              <i class="icon-menu-empty"></i>
              <h3>لا توجد فئات حالياً</h3>
              <p>يرجى المحاولة مرة أخرى لاحقاً.</p>
            </div>
          </div>
        </section>
      `;
    }
  } catch (error) {
    console.error('خطأ في تحميل صفحة القائمة:', error);
    contentContainer.innerHTML = `
      <div class="error-container">
        <i class="icon-error"></i>
        <h3>حدث خطأ</h3>
        <p>لم نتمكن من تحميل بيانات القائمة. يرجى المحاولة مرة أخرى.</p>
        <button class="btn btn-primary" id="retryBtn">إعادة المحاولة</button>
      </div>
    `;
    
    // إضافة معالج حدث لزر إعادة المحاولة
    const retryBtn = contentContainer.querySelector('#retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        renderMenu(container);
      });
    }
  }
}

// إضافة معالجات الأحداث لصفحة القائمة
function addEventListeners(container, selectedCategoryId) {
  // معالجة النقر على علامات تبويب الفئات
  const categoryTabs = container.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      const categoryId = tab.getAttribute('data-category');
      
      // تغيير علامة التبويب النشطة
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // تحميل عناصر الفئة المحددة
      loadCategoryItems(categoryId);
      
      // تحديث عنوان URL
      const url = new URL(window.location);
      url.searchParams.set('category', categoryId);
      window.history.pushState({}, '', url);
    });
  });
  
  // معالجة البحث في القائمة
  const searchBtn = container.querySelector('#searchBtn');
  const searchInput = container.querySelector('#menuSearch');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        // تنفيذ البحث
        searchMenuItems(searchTerm, selectedCategoryId);
      }
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
          // تنفيذ البحث
          searchMenuItems(searchTerm, selectedCategoryId);
        }
      }
    });
  }
}

// تحميل عناصر الفئة
async function loadCategoryItems(categoryId) {
  const menuItemsLoading = document.getElementById('menuItemsLoading');
  const menuGrid = document.getElementById('menuGrid');
  const noItems = document.getElementById('noItems');
  
  if (menuItemsLoading && menuGrid && noItems) {
    try {
      // إظهار شاشة التحميل
      menuItemsLoading.style.display = 'block';
      menuGrid.innerHTML = '';
      noItems.style.display = 'none';
      
      // جلب عناصر الفئة
      const menuItems = await getMenuItemsByCategory(categoryId);
      
      // إخفاء شاشة التحميل
      menuItemsLoading.style.display = 'none';
      
      if (menuItems.length > 0) {
        // عرض العناصر
        menuItems.forEach(item => {
          renderMenuCard(menuGrid, item, handleAddToCart);
        });
      } else {
        // لا توجد عناصر
        noItems.style.display = 'block';
      }
    } catch (error) {
      console.error('خطأ في تحميل عناصر الفئة:', error);
      menuItemsLoading.style.display = 'none';
      
      menuGrid.innerHTML = `
        <div class="error-message">
          <p>حدث خطأ أثناء تحميل عناصر القائمة. يرجى المحاولة مرة أخرى.</p>
        </div>
      `;
    }
  }
}

// البحث في عناصر القائمة
async function searchMenuItems(searchTerm, categoryId) {
  const menuItemsLoading = document.getElementById('menuItemsLoading');
  const menuGrid = document.getElementById('menuGrid');
  const noItems = document.getElementById('noItems');
  
  if (menuItemsLoading && menuGrid && noItems) {
    try {
      // إظهار شاشة التحميل
      menuItemsLoading.style.display = 'block';
      menuGrid.innerHTML = '';
      noItems.style.display = 'none';
      
      // جلب عناصر الفئة
      const menuItems = await getMenuItemsByCategory(categoryId);
      
      // فلترة العناصر حسب مصطلح البحث
      const filteredItems = menuItems.filter(item => {
        const searchValue = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchValue) ||
          (item.description && item.description.toLowerCase().includes(searchValue))
        );
      });
      
      // إخفاء شاشة التحميل
      menuItemsLoading.style.display = 'none';
      
      if (filteredItems.length > 0) {
        // عرض العناصر المفلترة
        filteredItems.forEach(item => {
          renderMenuCard(menuGrid, item, handleAddToCart);
        });
      } else {
        // لا توجد نتائج بحث
        noItems.innerHTML = '<p>لا توجد نتائج بحث مطابقة. يرجى تغيير مصطلح البحث أو تصفح جميع العناصر.</p>';
        noItems.style.display = 'block';
      }
    } catch (error) {
      console.error('خطأ في البحث عن عناصر القائمة:', error);
      menuItemsLoading.style.display = 'none';
      
      menuGrid.innerHTML = `
        <div class="error-message">
          <p>حدث خطأ أثناء البحث في القائمة. يرجى المحاولة مرة أخرى.</p>
        </div>
      `;
    }
  }
}

// معالجة إضافة العنصر للسلة
function handleAddToCart(item, options = [], quantity = 1) {
  // إضافة العنصر للسلة
  store.addToCart({
    id: item._id,
    name: item.name,
    price: item.price,
    image: item.image,
    options,
    quantity
  });
  
  // عرض إشعار
  showLocalNotification('تمت الإضافة للسلة', `تمت إضافة ${item.name} إلى سلة المشتريات`);
}