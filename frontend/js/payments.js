import { store } from './store.js';
import { router } from './router.js';

// دالة لإنشاء جلسة دفع
export async function createPaymentSession(orderId, paymentMethod) {
  try {
    const response = await fetch('/api/payment/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': store.getState().auth.token
      },
      body: JSON.stringify({ orderId, paymentMethod })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل إنشاء جلسة الدفع');
    }
    
    return data.data;
  } catch (error) {
    console.error('خطأ في إنشاء جلسة الدفع:', error);
    throw error;
  }
}

// دالة للتحقق من حالة الدفع
export async function checkPaymentStatus(sessionId) {
  try {
    const response = await fetch(`/api/payment/status/${sessionId}`, {
      headers: {
        'x-auth-token': store.getState().auth.token
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل التحقق من حالة الدفع');
    }
    
    return data.data;
  } catch (error) {
    console.error('خطأ في التحقق من حالة الدفع:', error);
    throw error;
  }
}

// دالة للبدء بعملية الدفع
export async function processPayment(orderId, paymentMethod) {
  try {
    // إنشاء جلسة دفع
    const session = await createPaymentSession(orderId, paymentMethod);
    
    // معالجة طريقة الدفع
    switch (paymentMethod) {
      case 'card':
        // فتح صفحة الدفع
        window.location.href = session.redirectUrl;
        break;
      case 'wallet':
        // التحقق من رصيد المحفظة
        // التحقق من رصيد المحفظة
        const walletResponse = await fetch('/api/payment/wallet/check-balance', {
            headers: {
              'x-auth-token': store.getState().auth.token
            }
          });
          
          const walletData = await walletResponse.json();
          
          if (!walletData.success) {
            throw new Error(walletData.message || 'فشل التحقق من رصيد المحفظة');
          }
          
          if (walletData.data.balance < session.amount) {
            throw new Error('رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أو اختيار طريقة دفع أخرى.');
          }
          
          // إتمام الدفع بالمحفظة
          const paymentResponse = await fetch('/api/payment/wallet/pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': store.getState().auth.token
            },
            body: JSON.stringify({ sessionId: session.id })
          });
          
          const paymentData = await paymentResponse.json();
          
          if (!paymentData.success) {
            throw new Error(paymentData.message || 'فشل الدفع باستخدام المحفظة');
          }
          
          // التوجيه إلى صفحة التأكيد
          router.navigate(`/order-tracking?orderId=${orderId}`);
          break;
        
        case 'cash':
          // لا يتطلب معالجة إضافية للدفع النقدي
          // التوجيه إلى صفحة التأكيد
          router.navigate(`/order-tracking?orderId=${orderId}`);
          break;
        
        default:
          throw new Error('طريقة دفع غير مدعومة');
      }
      
      return { success: true, sessionId: session.id };
    } catch (error) {
      console.error('خطأ في معالجة الدفع:', error);
      throw error;
    }
  }
  
  // دالة لاسترداد المدفوعات
  export async function refundPayment(orderId, reason = '') {
    try {
      const response = await fetch(`/api/payment/refund/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': store.getState().auth.token
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'فشل استرداد المدفوعات');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في استرداد المدفوعات:', error);
      throw error;
    }
  }
  
  // دالة للتحقق من توفر قسيمة خصم
  export async function validatePromoCode(code) {
    try {
      const response = await fetch(`/api/payment/promo-code/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': store.getState().auth.token
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'قسيمة الخصم غير صالحة');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في التحقق من قسيمة الخصم:', error);
      throw error;
    }
  }
  
  // دالة لحساب تكلفة الطلب مع الخصومات
  export function calculateOrderTotal(items, deliveryFee = 0, promoCode = null) {
    // حساب السعر الأساسي
    let subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
    
    // حساب الخصم
    let discount = 0;
    if (promoCode) {
      if (promoCode.type === 'percentage') {
        discount = subtotal * (promoCode.value / 100);
      } else if (promoCode.type === 'fixed') {
        discount = promoCode.value;
      }
      
      // التأكد من عدم تجاوز الخصم للسعر الإجمالي
      discount = Math.min(discount, subtotal);
    }
    
    // حساب الضريبة
    const taxRate = 0.15; // 15% ضريبة القيمة المضافة
    const tax = (subtotal - discount) * taxRate;
    
    // حساب السعر الإجمالي
    const total = subtotal - discount + tax + deliveryFee;
    
    return {
      subtotal,
      discount,
      tax,
      deliveryFee,
      total: Math.round(total * 100) / 100 // تقريب إلى أقرب قرشين
    };
  }
  
  // دالة لتنسيق المبلغ كعملة
  export function formatCurrency(amount, currency = 'SAR') {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // دالة للحصول على قائمة وسائل الدفع المتاحة
  export async function getAvailablePaymentMethods() {
    try {
      const response = await fetch('/api/payment/methods', {
        headers: {
          'x-auth-token': store.getState().auth.token
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'فشل جلب وسائل الدفع المتاحة');
      }
      
      return data.data;
    } catch (error) {
      console.error('خطأ في جلب وسائل الدفع المتاحة:', error);
      // إرجاع وسائل الدفع الافتراضية في حالة الخطأ
      return [
        { id: 'cash', name: 'نقدي عند الاستلام', enabled: true },
        { id: 'card', name: 'بطاقة ائتمان', enabled: true },
        { id: 'wallet', name: 'محفظة إلكترونية', enabled: false }
      ];
    }
  }