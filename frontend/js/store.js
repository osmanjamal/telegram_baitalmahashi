// تخزين حالة التطبيق المركزية
class Store {
    constructor() {
      // الحالة الأولية
      this.state = {
        auth: {
          isAuthenticated: false,
          token: null,
          user: null,
          redirectAfterLogin: null
        },
        cart: {
          items: [],
          totalPrice: 0
        },
        menu: {
          categories: [],
          items: [],
          featuredItems: []
        },
        orders: {
          list: [],
          activeOrder: null,
          orderHistory: []
        },
        ui: {
          theme: 'light',
          language: 'ar',
          notifications: []
        }
      };
      
      // قائمة المستمعين
      this.listeners = [];
    }
    
    // تهيئة المتجر
    async init() {
      // تحميل البيانات من التخزين المحلي
      this.loadFromLocalStorage();
      
      // تحديث عدد العناصر في السلة
      this.updateCartBadge();
    }
    
    // الحصول على الحالة
    getState() {
      return { ...this.state };
    }
    
    // تحديث الحالة
    setState(newState) {
      this.state = {
        ...this.state,
        ...newState
      };
      
      // تحديث التخزين المحلي
      this.saveToLocalStorage();
      
      // إخطار المستمعين
      this.notifyListeners();
    }
    
    // تحديث جزء من الحالة
    updateState(key, value) {
      if (typeof key === 'string' && key.includes('.')) {
        // تحديث كائن متداخل
        const keys = key.split('.');
        let current = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      } else {
        // تحديث كائن مباشر
        this.state[key] = value;
      }
      
      // تحديث التخزين المحلي
      this.saveToLocalStorage();
      
      // إخطار المستمعين
      this.notifyListeners();
    }
    
    // إضافة مستمع
    subscribe(listener) {
      this.listeners.push(listener);
      
      // إرجاع دالة لإلغاء الاشتراك
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }
    
    // إخطار المستمعين
    notifyListeners() {
      this.listeners.forEach(listener => listener(this.state));
    }
    
    // حفظ البيانات في التخزين المحلي
    saveToLocalStorage() {
      // حفظ رمز المصادقة
      if (this.state.auth.token) {
        localStorage.setItem('token', this.state.auth.token);
      } else {
        localStorage.removeItem('token');
      }
      
      // حفظ معلومات المستخدم
      if (this.state.auth.user) {
        localStorage.setItem('user', JSON.stringify(this.state.auth.user));
      } else {
        localStorage.removeItem('user');
      }
      
      // حفظ سلة التسوق
      localStorage.setItem('cart', JSON.stringify(this.state.cart));
      
      // حفظ السمة
      localStorage.setItem('theme', this.state.ui.theme);
      
      // حفظ اللغة
      localStorage.setItem('language', this.state.ui.language);
    }
    
    // تحميل البيانات من التخزين المحلي
    loadFromLocalStorage() {
      // تحميل رمز المصادقة
      const token = localStorage.getItem('token');
      
      // تحميل معلومات المستخدم
      let user = null;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          user = JSON.parse(userJson);
        }
      } catch (error) {
        console.error('خطأ في تحميل معلومات المستخدم:', error);
      }
      
      // تحميل سلة التسوق
      let cart = {
        items: [],
        totalPrice: 0
      };
      try {
        const cartJson = localStorage.getItem('cart');
        if (cartJson) {
          cart = JSON.parse(cartJson);
        }
      } catch (error) {
        console.error('خطأ في تحميل سلة التسوق:', error);
      }
      
      // تحميل السمة
      const theme = localStorage.getItem('theme') || 'light';
      
      // تحميل اللغة
      const language = localStorage.getItem('language') || 'ar';
      
      // تحديث الحالة
      this.state = {
        ...this.state,
        auth: {
          ...this.state.auth,
          isAuthenticated: !!token,
          token,
          user
        },
        cart,
        ui: {
          ...this.state.ui,
          theme,
          language
        }
      };
    }
    
    // دوال مساعدة لسلة التسوق
    
    // إضافة عنصر إلى السلة
    addToCart(item) {
      const { items } = this.state.cart;
      
      // البحث عن العنصر في السلة
      const existingItemIndex = items.findIndex(cartItem => 
        cartItem.id === item.id && 
        JSON.stringify(cartItem.options) === JSON.stringify(item.options)
      );
      
      if (existingItemIndex !== -1) {
        // تحديث الكمية إذا كان العنصر موجودًا بالفعل
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += item.quantity || 1;
        
        // تحديث السعر الإجمالي للعنصر
        updatedItems[existingItemIndex].totalPrice = 
          updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        
        this.updateState('cart', {
          items: updatedItems,
          totalPrice: this.calculateTotalPrice(updatedItems)
        });
      } else {
        // إضافة العنصر إذا لم يكن موجودًا
        const newItem = {
          ...item,
          quantity: item.quantity || 1,
          totalPrice: item.price * (item.quantity || 1)
        };
        
        this.updateState('cart', {
          items: [...items, newItem],
          totalPrice: this.calculateTotalPrice([...items, newItem])
        });
      }
      
      // تحديث عدد العناصر في السلة
      this.updateCartBadge();
    }
    
    // إزالة عنصر من السلة
    removeFromCart(itemId, options = []) {
      const { items } = this.state.cart;
      
      // البحث عن العنصر في السلة
      const updatedItems = items.filter(item => 
        !(item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
      );
      
      this.updateState('cart', {
        items: updatedItems,
        totalPrice: this.calculateTotalPrice(updatedItems)
      });
      
      // تحديث عدد العناصر في السلة
      this.updateCartBadge();
    }
    
    // تحديث كمية عنصر في السلة
    updateCartItemQuantity(itemId, options = [], quantity) {
      const { items } = this.state.cart;
      
      // البحث عن العنصر في السلة
      const updatedItems = items.map(item => {
        if (item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options)) {
          return {
            ...item,
            quantity,
            totalPrice: item.price * quantity
          };
        }
        return item;
      });
      
      this.updateState('cart', {
        items: updatedItems,
        totalPrice: this.calculateTotalPrice(updatedItems)
      });
      
      // تحديث عدد العناصر في السلة
      this.updateCartBadge();
    }
    
    // تفريغ السلة
    clearCart() {
      this.updateState('cart', {
        items: [],
        totalPrice: 0
      });
      
      // تحديث عدد العناصر في السلة
      this.updateCartBadge();
    }
    
    // حساب السعر الإجمالي للسلة
    calculateTotalPrice(items) {
      return items.reduce((total, item) => total + item.totalPrice, 0);
    }
    
    // الحصول على عدد العناصر في السلة
    getCartItemsCount() {
      return this.state.cart.items.reduce((count, item) => count + item.quantity, 0);
    }
    
    // تحديث شارة السلة
    updateCartBadge() {
      const cartBadge = document.getElementById('cartBadge');
      const cartCount = this.getCartItemsCount();
      
      if (cartBadge) {
        cartBadge.textContent = cartCount;
        
        if (cartCount > 0) {
          cartBadge.style.display = 'flex';
        } else {
          cartBadge.style.display = 'none';
        }
      }
    }
    
    // دوال المصادقة
    
    // تسجيل الدخول
    login(token, user) {
      this.updateState('auth', {
        isAuthenticated: true,
        token,
        user
      });
    }
    
    // تسجيل الخروج
    logout() {
      this.updateState('auth', {
        isAuthenticated: false,
        token: null,
        user: null,
        redirectAfterLogin: null
      });
    }
  }
  
  // إنشاء كائن المتجر
  export const store = new Store();