import { store } from '../../js/store.js';
import { updateCartBadge } from '../../js/app.js';
import { renderHeader } from '../shared/Header.js';
import { renderFooter } from '../shared/Footer.js';

export function renderMainLayout(container, content) {
  // عرض تخطيط الصفحة الرئيسية
  container.innerHTML = `
    <div class="main-layout">
      <!-- الرأس -->
      <header id="header" class="header"></header>
      
      <!-- المحتوى -->
      <main class="content" id="content">
        ${content || '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'}
      </main>
      
      <!-- الذيل -->
      <footer id="footer" class="footer"></footer>
    </div>
  `;
  
  // عرض مكونات التخطيط
  renderHeader(document.getElementById('header'));
  renderFooter(document.getElementById('footer'));
  
  // تحديث عدد العناصر في السلة
  updateCartBadge();
  
  return document.getElementById('content');
}

// دالة لتحديث محتوى التخطيط
export function updateMainLayoutContent(content) {
  const contentContainer = document.getElementById('content');
  if (contentContainer) {
    contentContainer.innerHTML = content;
  }
}

// دالة لعرض رسالة تحميل
export function showMainLayoutLoading() {
  updateMainLayoutContent('<div class="loading-spinner-container"><div class="loading-spinner"></div></div>');
}

// دالة لعرض رسالة خطأ
export function showMainLayoutError(message) {
  updateMainLayoutContent(`
    <div class="error-container">
      <i class="icon-error"></i>
      <h3>حدث خطأ</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="window.location.reload()">إعادة المحاولة</button>
    </div>
  `);
}