import { store } from '../../js/store.js';

export function renderPaymentMethods(container, onPaymentMethodSelect, selectedMethod = null) {
  // الحصول على الطرق المتاحة
  const availableMethods = [
    {
      id: 'cash',
      name: 'الدفع عند الاستلام',
      icon: 'cash',
      description: 'ادفع نقداً عند استلام طلبك'
    },
    {
      id: 'card',
      name: 'بطاقة ائتمان',
      icon: 'credit-card',
      description: 'ادفع باستخدام فيزا، ماستركارد أو مدى'
    },
    {
      id: 'wallet',
      name: 'محفظة إلكترونية',
      icon: 'wallet',
      description: 'استخدم رصيد محفظتك الإلكترونية',
      disabled: true
    }
  ];
  
  // عرض طرق الدفع
  container.innerHTML = `
    <div class="payment-methods">
      ${availableMethods.map(method => `
        <div class="payment-method-item ${method.disabled ? 'disabled' : ''} ${selectedMethod === method.id ? 'selected' : ''}" data-method="${method.id}">
          <div class="payment-method-icon">
            <img src="/assets/icons/payment-icons/${method.icon}.svg" alt="${method.name}">
          </div>
          <div class="payment-method-info">
            <h3>${method.name}</h3>
            <p>${method.description}</p>
            ${method.disabled ? '<span class="disabled-label">قريباً</span>' : ''}
          </div>
          <div class="payment-method-check">
            <div class="radio-circle ${selectedMethod === method.id ? 'checked' : ''}"></div>
          </div>
        </div>
      `).join('')}
      
      <div class="payment-info">
        <div class="payment-security">
          <i class="icon-lock"></i>
          <span>جميع المعاملات آمنة ومشفرة</span>
        </div>
        
        <div class="payment-logos">
          <img src="/assets/icons/payment-icons/visa.svg" alt="Visa">
          <img src="/assets/icons/payment-icons/mastercard.svg" alt="Mastercard">
          <img src="/assets/icons/payment-icons/mada.svg" alt="Mada">
        </div>
      </div>
    </div>
  `;
  
  // إضافة معالجات الأحداث
  const paymentMethodItems = container.querySelectorAll('.payment-method-item:not(.disabled)');
  
  paymentMethodItems.forEach(item => {
    item.addEventListener('click', () => {
      // إزالة الفئة المحددة من جميع العناصر
      paymentMethodItems.forEach(i => {
        i.classList.remove('selected');
        i.querySelector('.radio-circle').classList.remove('checked');
      });
      
      // إضافة الفئة المحددة للعنصر المحدد
      item.classList.add('selected');
      item.querySelector('.radio-circle').classList.add('checked');
      
      // استدعاء الدالة المعالجة
      if (onPaymentMethodSelect) {
        const methodId = item.getAttribute('data-method');
        onPaymentMethodSelect(methodId);
      }
    });
  });
}

// تقديم نموذج الدفع ببطاقة الائتمان
export function renderCreditCardForm(container, onSubmit) {
  container.innerHTML = `
    <div class="credit-card-form">
      <div class="form-group">
        <label for="cardNumber">رقم البطاقة</label>
        <input type="text" id="cardNumber" class="form-control" placeholder="1234 5678 9012 3456" maxlength="19">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="cardExpiry">تاريخ الانتهاء</label>
          <input type="text" id="cardExpiry" class="form-control" placeholder="MM/YY" maxlength="5">
        </div>
        
        <div class="form-group">
          <label for="cardCvv">رمز الأمان (CVV)</label>
          <input type="text" id="cardCvv" class="form-control" placeholder="123" maxlength="3">
        </div>
      </div>
      
      <div class="form-group">
        <label for="cardName">الاسم على البطاقة</label>
        <input type="text" id="cardName" class="form-control" placeholder="محمد أحمد">
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-primary btn-block" id="submitCardBtn">
          تأكيد الدفع
        </button>
      </div>
    </div>
  `;
  
  // إضافة معالجات الأحداث
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCvvInput = document.getElementById('cardCvv');
  const submitCardBtn = document.getElementById('submitCardBtn');
  
  // تنسيق رقم البطاقة (إضافة مسافات)
  cardNumberInput.addEventListener('input', (e) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = formattedValue;
  });
  
  // تنسيق تاريخ الانتهاء (MM/YY)
  cardExpiryInput.addEventListener('input', (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    let formattedValue = value;
    
    if (value.length > 2) {
      formattedValue = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    e.target.value = formattedValue;
  });
  
  // تحقق من أن رمز CVV يحتوي على أرقام فقط
  cardCvvInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/gi, '');
  });
  
  // معالجة تقديم النموذج
  submitCardBtn.addEventListener('click', () => {
    const cardNumber = cardNumberInput.value.replace(/\s+/g, '');
    const cardExpiry = cardExpiryInput.value;
    const cardCvv = cardCvvInput.value;
    const cardName = document.getElementById('cardName').value;
    
    // تحقق أساسي من البيانات
    if (cardNumber.length < 16 || !cardExpiry.includes('/') || cardCvv.length < 3 || !cardName) {
      alert('يرجى التحقق من صحة بيانات البطاقة');
      return;
    }
    
    // استدعاء الدالة المعالجة
    if (onSubmit) {
      onSubmit({
        cardNumber,
        cardExpiry,
        cardCvv,
        cardName
      });
    }
  });
}

// عرض نموذج اختيار المحفظة الإلكترونية
export function renderWalletPaymentForm(container, onSubmit) {
  // الحصول على رصيد المحفظة من المخزن
  const walletBalance = store.getState().auth.user?.walletBalance || 0;
  
  container.innerHTML = `
    <div class="wallet-payment-form">
      <div class="wallet-balance">
        <h3>رصيد المحفظة</h3>
        <div class="balance-amount">${formatCurrency(walletBalance)}</div>
      </div>
      
      ${walletBalance > 0 ? `
        <div class="form-actions">
          <button type="button" class="btn btn-primary btn-block" id="confirmWalletBtn">
            تأكيد الدفع من المحفظة
          </button>
        </div>
      ` : `
        <div class="low-balance-alert">
          <i class="icon-warning"></i>
          <p>رصيد المحفظة غير كافٍ</p>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary btn-block" id="rechargeWalletBtn">
            شحن المحفظة
          </button>
        </div>
      `}
    </div>
  `;
  
  // إضافة معالجات الأحداث
  const confirmWalletBtn = document.getElementById('confirmWalletBtn');
  const rechargeWalletBtn = document.getElementById('rechargeWalletBtn');
  
  if (confirmWalletBtn) {
    confirmWalletBtn.addEventListener('click', () => {
      // استدعاء الدالة المعالجة
      if (onSubmit) {
        onSubmit({ walletBalance });
      }
    });
  }
  
  if (rechargeWalletBtn) {
    rechargeWalletBtn.addEventListener('click', () => {
      // إظهار نموذج شحن المحفظة
      showRechargeWalletForm(container, onSubmit);
    });
  }
}

// عرض نموذج شحن المحفظة
function showRechargeWalletForm(container, onSubmit) {
  container.innerHTML = `
    <div class="recharge-wallet-form">
      <h3>شحن المحفظة</h3>
      
      <div class="form-group">
        <label for="rechargeAmount">المبلغ</label>
        <input type="number" id="rechargeAmount" class="form-control" min="10" step="10" value="100">
      </div>
      
      <div class="recharge-options">
        <button type="button" class="recharge-option" data-amount="50">50 ريال</button>
        <button type="button" class="recharge-option" data-amount="100">100 ريال</button>
        <button type="button" class="recharge-option" data-amount="200">200 ريال</button>
        <button type="button" class="recharge-option" data-amount="500">500 ريال</button>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-outline" id="backToWalletBtn">
          رجوع
        </button>
        <button type="button" class="btn btn-primary" id="submitRechargeBtn">
          متابعة
        </button>
      </div>
    </div>
  `;
  
  // إضافة معالجات الأحداث
  const rechargeAmountInput = document.getElementById('rechargeAmount');
  const rechargeOptions = document.querySelectorAll('.recharge-option');
  const backToWalletBtn = document.getElementById('backToWalletBtn');
  const submitRechargeBtn = document.getElementById('submitRechargeBtn');
  
  // اختيار مبلغ الشحن
  rechargeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const amount = option.getAttribute('data-amount');
      rechargeAmountInput.value = amount;
    });
  });
  
  // العودة إلى نموذج المحفظة
  backToWalletBtn.addEventListener('click', () => {
    renderWalletPaymentForm(container, onSubmit);
  });
  
  // متابعة الشحن
  submitRechargeBtn.addEventListener('click', () => {
    const amount = parseFloat(rechargeAmountInput.value);
    
    if (isNaN(amount) || amount < 10) {
      alert('يرجى إدخال مبلغ صحيح (10 ريال على الأقل)');
      return;
    }
    
    // عرض نموذج بطاقة الائتمان لشحن المحفظة
    renderCreditCardForm(container, (cardData) => {
      // في تطبيق حقيقي، قم بمعالجة شحن المحفظة ثم استدعاء دالة تأكيد الدفع
      // هنا نقوم بمحاكاة نجاح الشحن
      
      // استدعاء الدالة المعالجة
      if (onSubmit) {
        onSubmit({
          walletBalance: amount,
          rechargeAmount: amount,
          cardData
        });
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