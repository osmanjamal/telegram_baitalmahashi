import { store } from './store.js';
import { router } from './router.js';

// عنوان API الأساسي
const API_BASE_URL = '/api';

// دالة لإنشاء طلب
async function fetchAPI(endpoint, options = {}) {
  // الإعدادات الافتراضية
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // إضافة رمز المصادقة إذا كان المستخدم مسجل الدخول
  const token = store.getState().auth.token;
  if (token) {
    defaultOptions.headers['x-auth-token'] = token;
  }
  
  // دمج الإعدادات
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    // إجراء الطلب
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // التحقق من حالة الاستجابة
    if (response.status === 401) {
      // إذا كان غير مصرح، قم بتسجيل الخروج
      store.logout();
      router.navigate('/auth');
      throw new Error('غير مصرح بالوصول، يرجى تسجيل الدخول');
    }
    
    // تحويل الاستجابة إلى JSON
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ أثناء معالجة الطلب');
    }
    
    return data;
  } catch (error) {
    console.error('خطأ في طلب API:', error);
    throw error;
  }
}

// دالة للتحقق من حالة المصادقة
export async function checkAuthStatus() {
  // التحقق من وجود رمز المصادقة
  const token = store.getState().auth.token;
  
  if (!token) {
    return;
  }
  
  try {
    const data = await fetchAPI('/auth/me', { method: 'GET' });
    
    if (data.success) {
      // تحديث معلومات المستخدم
      store.login(token, data.user);
    } else {
      // تسجيل الخروج إذا فشلت المصادقة
      store.logout();
    }
  } catch (error) {
    console.error('فشل التحقق من حالة المصادقة:', error);
    store.logout();
  }
}

// دوال المصادقة

// تسجيل الدخول بواسطة تلغرام
export async function loginWithTelegram(telegramData) {
  try {
    const data = await fetchAPI('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(telegramData)
    });
    
    if (data.success && data.token) {
      // تسجيل الدخول
      store.login(data.token, data.user);
      
      // التوجيه إلى الصفحة المقصودة بعد تسجيل الدخول
      const redirectPath = store.getState().auth.redirectAfterLogin || '/';
      store.updateState('auth.redirectAfterLogin', null);
      router.navigate(redirectPath);
      
      return { success: true };
    }
    
    return { success: false, message: data.message || 'فشل تسجيل الدخول' };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return { success: false, message: error.message || 'فشل تسجيل الدخول' };
  }
}

// تسجيل الدخول للمشرفين
export async function loginAdmin(credentials) {
  try {
    const data = await fetchAPI('/auth/admin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.success && data.token) {
      // تسجيل الدخول
      store.login(data.token, data.user);
      
      // التوجيه إلى لوحة التحكم
      router.navigate('/admin');
      
      return { success: true };
    }
    
    return { success: false, message: data.message || 'فشل تسجيل الدخول' };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول للمشرفين:', error);
    return { success: false, message: error.message || 'فشل تسجيل الدخول' };
  }
}

// تسجيل الدخول للمطبخ
export async function loginKitchen(credentials) {
  try {
    const data = await fetchAPI('/auth/kitchen', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.success && data.token) {
      // تسجيل الدخول
      store.login(data.token, data.user);
      
      // التوجيه إلى لوحة المطبخ
      router.navigate('/kitchen');
      
      return { success: true };
    }
    
    return { success: false, message: data.message || 'فشل تسجيل الدخول' };
  } catch (error) {
    console.error('خطأ في تسجيل الدخول للمطبخ:', error);
    return { success: false, message: error.message || 'فشل تسجيل الدخول' };
  }
}

// تسجيل الخروج
export function logout() {
  store.logout();
  router.navigate('/');
}

// دوال القائمة

// الحصول على فئات القائمة
export async function getCategories() {
  try {
    const data = await fetchAPI('/menu/categories', { method: 'GET' });
    
    if (data.success) {
      // تحديث فئات القائمة في المتجر
      store.updateState('menu.categories', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب فئات القائمة');
  } catch (error) {
    console.error('خطأ في جلب فئات القائمة:', error);
    throw error;
  }
}

// الحصول على عناصر القائمة حسب الفئة
export async function getMenuItemsByCategory(categoryId) {
  try {
    const data = await fetchAPI(`/menu/category/${categoryId}`, { method: 'GET' });
    
    if (data.success) {
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب عناصر القائمة');
  } catch (error) {
    console.error('خطأ في جلب عناصر القائمة:', error);
    throw error;
  }
}

// الحصول على العناصر المميزة
export async function getFeaturedItems() {
  try {
    const data = await fetchAPI('/menu/featured', { method: 'GET' });
    
    if (data.success) {
      // تحديث العناصر المميزة في المتجر
      store.updateState('menu.featuredItems', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب العناصر المميزة');
  } catch (error) {
    console.error('خطأ في جلب العناصر المميزة:', error);
    throw error;
  }
}

// دوال الطلبات

// إنشاء طلب جديد
export async function createOrder(orderData) {
  try {
    const data = await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    
    if (data.success) {
      // تفريغ السلة بعد إنشاء الطلب
      store.clearCart();
      
      return { success: true, orderId: data.data._id };
    }
    
    return { success: false, message: data.message || 'فشل إنشاء الطلب' };
  } catch (error) {
    console.error('خطأ في إنشاء الطلب:', error);
    return { success: false, message: error.message || 'فشل إنشاء الطلب' };
  }
}

// الحصول على طلب بواسطة المعرف
export async function getOrderById(orderId) {
  try {
    const data = await fetchAPI(`/orders/${orderId}`, { method: 'GET' });
    
    if (data.success) {
      // تحديث الطلب النشط في المتجر
      store.updateState('orders.activeOrder', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب الطلب');
  } catch (error) {
    console.error('خطأ في جلب الطلب:', error);
    throw error;
  }
}

// الحصول على طلبات المستخدم
export async function getUserOrders() {
  try {
    const data = await fetchAPI('/orders/me', { method: 'GET' });
    
    if (data.success) {
      // تحديث قائمة الطلبات في المتجر
      store.updateState('orders.orderHistory', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب الطلبات');
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error);
    throw error;
  }
}

// إلغاء طلب
export async function cancelOrder(orderId, reason) {
  try {
    const data = await fetchAPI(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason: reason })
    });
    
    return { success: data.success, message: data.message };
  } catch (error) {
    console.error('خطأ في إلغاء الطلب:', error);
    return { success: false, message: error.message || 'فشل إلغاء الطلب' };
  }
}

// دوال الملف الشخصي

// الحصول على الملف الشخصي
export async function getUserProfile() {
  try {
    const data = await fetchAPI('/users/profile', { method: 'GET' });
    
    if (data.success) {
      // تحديث معلومات المستخدم في المتجر
      store.updateState('auth.user', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب الملف الشخصي');
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    throw error;
  }
}

// تحديث الملف الشخصي
export async function updateUserProfile(profileData) {
  try {
    const data = await fetchAPI('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (data.success) {
      // تحديث معلومات المستخدم في المتجر
      store.updateState('auth.user', {
        ...store.getState().auth.user,
        ...data.data
      });
      
      return { success: true };
    }
    
    return { success: false, message: data.message || 'فشل تحديث الملف الشخصي' };
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return { success: false, message: error.message || 'فشل تحديث الملف الشخصي' };
  }
}

// إضافة عنوان
export async function addAddress(addressData) {
  try {
    const data = await fetchAPI('/users/address', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
    
    if (data.success) {
      // تحديث الملف الشخصي
      await getUserProfile();
      
      return { success: true, address: data.data };
    }
    
    return { success: false, message: data.message || 'فشل إضافة العنوان' };
  } catch (error) {
    console.error('خطأ في إضافة العنوان:', error);
    return { success: false, message: error.message || 'فشل إضافة العنوان' };
  }
}

// دوال المدفوعات والتوصيل

// إنشاء جلسة دفع
export async function createPaymentSession(orderId, paymentMethod) {
  try {
    const data = await fetchAPI('/payment/session', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod })
    });
    
    if (data.success) {
      return { success: true, sessionId: data.data.sessionId, redirectUrl: data.data.redirectUrl };
    }
    
    return { success: false, message: data.message || 'فشل إنشاء جلسة الدفع' };
  } catch (error) {
    console.error('خطأ في إنشاء جلسة الدفع:', error);
    return { success: false, message: error.message || 'فشل إنشاء جلسة الدفع' };
  }
}

// التحقق من نطاق التوصيل
export async function checkDeliveryRange(coordinates) {
  try {
    const data = await fetchAPI('/location/check-delivery-range', {
      method: 'POST',
      body: JSON.stringify({ coordinates })
    });
    
    return data.data;
  } catch (error) {
    console.error('خطأ في التحقق من نطاق التوصيل:', error);
    throw error;
  }
}

// دوال المطبخ

// الحصول على الطلبات النشطة
export async function getActiveOrders() {
  try {
    const data = await fetchAPI('/kitchen/orders/active', { method: 'GET' });
    
    if (data.success) {
      return data.data;
    }
    
    throw new Error(data.message || 'فشل جلب الطلبات النشطة');
  } catch (error) {
    console.error('خطأ في جلب الطلبات النشطة:', error);
    throw error;
  }
}

// تحديث حالة الطلب
export async function updateOrderStatus(orderId, status, note = '') {
  try {
    const data = await fetchAPI(`/kitchen/order/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
    
    return { success: data.success, message: data.message };
  } catch (error) {
    console.error('خطأ في تحديث حالة الطلب:', error);
    return { success: false, message: error.message || 'فشل تحديث حالة الطلب' };
  }
}