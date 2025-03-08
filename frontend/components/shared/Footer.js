export function renderFooter(container) {
    const currentYear = new Date().getFullYear();
    
    container.innerHTML = `
      <div class="container">
        <div class="footer-top">
          <div class="row">
            <div class="col">
              <div class="footer-logo">
                <img src="/assets/images/logo/logo-full.png" alt="بيت المحاشي">
              </div>
              <p class="footer-description">
                بيت المحاشي هو وجهتك المثالية لتناول ألذ أطباق المحاشي الشرقية المحضرة بأجود المكونات وبأيدي أمهر الطهاة.
              </p>
            </div>
            
            <div class="col">
              <h3 class="footer-title">روابط مفيدة</h3>
              <ul class="footer-links">
                <li><a href="/" data-nav>الرئيسية</a></li>
                <li><a href="/menu" data-nav>قائمة الطعام</a></li>
                <li><a href="/cart" data-nav>سلة المشتريات</a></li>
                <li><a href="/profile" data-nav>حسابي</a></li>
                <li><a href="/about" data-nav>من نحن</a></li>
                <li><a href="/contact" data-nav>اتصل بنا</a></li>
              </ul>
            </div>
            
            <div class="col">
              <h3 class="footer-title">فئات الطعام</h3>
              <ul class="footer-links">
                <li><a href="/menu?category=breakfast" data-nav>وجبات الفطور</a></li>
                <li><a href="/menu?category=lunch" data-nav>وجبات الغداء</a></li>
                <li><a href="/menu?category=dinner" data-nav>وجبات العشاء</a></li>
                <li><a href="/menu?category=appetizers" data-nav>المقبلات</a></li>
                <li><a href="/menu?category=desserts" data-nav>الحلويات</a></li>
                <li><a href="/menu?category=beverages" data-nav>المشروبات</a></li>
              </ul>
            </div>
            
            <div class="col">
              <h3 class="footer-title">تواصل معنا</h3>
              <ul class="footer-contact">
                <li>
                  <i class="icon-map-marker"></i>
                  <span>شارع الملك فهد، الرياض، المملكة العربية السعودية</span>
                </li>
                <li>
                  <i class="icon-phone"></i>
                  <span>+966 12 345 6789</span>
                </li>
                <li>
                  <i class="icon-envelope"></i>
                  <span>info@baytalmahashy.com</span>
                </li>
              </ul>
              
              <h3 class="footer-title">تابعنا</h3>
              <div class="social-links">
                <a href="#" class="social-link"><i class="icon-facebook"></i></a>
                <a href="#" class="social-link"><i class="icon-twitter"></i></a>
                <a href="#" class="social-link"><i class="icon-instagram"></i></a>
                <a href="#" class="social-link"><i class="icon-snapchat"></i></a>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <div class="copyright">
            &copy; ${currentYear} بيت المحاشي. جميع الحقوق محفوظة.
          </div>
          
          <div class="footer-bottom-links">
            <a href="/privacy" data-nav>سياسة الخصوصية</a>
            <a href="/terms" data-nav>الشروط والأحكام</a>
          </div>
          
          <div class="payment-methods">
            <img src="/assets/icons/payment-icons/credit-card.svg" alt="بطاقة ائتمان">
            <img src="/assets/icons/payment-icons/cash.svg" alt="نقدي">
            <img src="/assets/icons/payment-icons/wallet.svg" alt="محفظة إلكترونية">
          </div>
        </div>
        
        <!-- زر العودة لأعلى -->
        <button id="backToTopBtn" class="back-to-top-btn">
          <i class="icon-arrow-up"></i>
        </button>
      </div>
    `;
    
    // معالجة زر العودة لأعلى
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    // إظهار/إخفاء الزر حسب موضع التمرير
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    
    // التمرير إلى أعلى عند النقر على الزر
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }