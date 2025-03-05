
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StorefrontHeader from './StorefrontHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, ArrowLeft, Plus, Minus } from 'lucide-react';
import useStoreData, { getCurrencyFormatter } from '@/hooks/use-store-data';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

const CartPage = () => {
  const navigate = useNavigate();
  const { data: storeData } = useStoreData();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const formatCurrency = getCurrencyFormatter(storeData?.currency);

  // استرجاع البيانات من التخزين المحلي
  useEffect(() => {
    const loadCart = () => {
      const cart = localStorage.getItem('shopping-cart');
      if (cart) {
        setCartItems(JSON.parse(cart));
      }
    };
    
    loadCart();
  }, []);

  // حساب المجموع الفرعي
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // رسوم الشحن
  const shippingFee = subtotal > 0 ? 2 : 0;
  
  // المجموع النهائي
  const total = subtotal + shippingFee - discountAmount;

  // تحديث الكمية
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity > 0) {
      const updatedItems = [...cartItems];
      updatedItems[index].quantity = newQuantity;
      setCartItems(updatedItems);
      
      // تحديث التخزين المحلي
      localStorage.setItem('shopping-cart', JSON.stringify(updatedItems));
    }
  };

  // حذف عنصر من السلة
  const removeItem = (index: number) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
    
    // تحديث التخزين المحلي
    localStorage.setItem('shopping-cart', JSON.stringify(updatedItems));
    
    toast.success('تم حذف المنتج من السلة');
  };

  // تطبيق كود الخصم
  const applyCoupon = () => {
    setLoading(true);
    
    // محاكاة طلب API
    setTimeout(() => {
      if (couponCode.toLowerCase() === 'خصم10' || couponCode.toLowerCase() === 'discount10') {
        const discount = subtotal * 0.1; // خصم 10%
        setDiscountAmount(discount);
        toast.success('تم تطبيق كود الخصم بنجاح');
      } else if (couponCode.toLowerCase() === 'خصم20' || couponCode.toLowerCase() === 'discount20') {
        const discount = subtotal * 0.2; // خصم 20%
        setDiscountAmount(discount);
        toast.success('تم تطبيق كود الخصم بنجاح');
      } else {
        setDiscountAmount(0);
        toast.error('كود الخصم غير صالح');
      }
      
      setLoading(false);
    }, 1000);
  };

  // إجراء الطلب
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    
    toast.success('تم إرسال الطلب بنجاح');
    
    // إفراغ السلة
    setCartItems([]);
    localStorage.removeItem('shopping-cart');
    
    // إعادة التوجيه إلى الصفحة الرئيسية
    setTimeout(() => {
      navigate(`/store-preview/${storeData?.domain_name}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <StorefrontHeader cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <ShoppingCart className="ml-2 h-6 w-6" />
            سلة التسوق
          </h1>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold mb-2">سلة التسوق فارغة</h2>
                <p className="text-gray-600 mb-6">لم تقم بإضافة أي منتجات إلى سلة التسوق.</p>
                <Button onClick={() => navigate(`/store-preview/${storeData?.domain_name}`)}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للتسوق
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* قائمة المنتجات */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-32 h-32 bg-gray-100">
                          <img 
                            src={item.image_url || '/placeholder.svg'} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 p-4 flex flex-col sm:flex-row justify-between">
                          <div>
                            <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                            <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
                          </div>
                          <div className="flex flex-col justify-between mt-4 sm:mt-0">
                            <div className="flex items-center space-x-3 rtl:space-x-reverse">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2 justify-start px-2"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button 
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/store-preview/${storeData?.domain_name}`)}
                >
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  متابعة التسوق
                </Button>
              </div>
              
              {/* ملخص الطلب */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">ملخص الطلب</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المجموع الفرعي</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">رسوم الشحن</span>
                        <span>{formatCurrency(shippingFee)}</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>الخصم</span>
                          <span>- {formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between font-bold text-lg">
                        <span>الإجمالي</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      
                      {/* كود الخصم */}
                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-2">كود الخصم</h4>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <Input 
                            placeholder="أدخل كود الخصم" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            onClick={applyCoupon}
                            disabled={loading || !couponCode}
                          >
                            تطبيق
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">جرب 'خصم10' أو 'خصم20' للعرض التجريبي</p>
                      </div>
                      
                      <Button 
                        className="w-full py-6 text-lg mt-6" 
                        onClick={handleCheckout}
                      >
                        إتمام الطلب
                      </Button>
                      
                      <div className="flex justify-center space-x-4 rtl:space-x-reverse mt-6">
                        <img src="/payment-icons/mada.png" alt="مدى" className="h-8" />
                        <img src="/payment-icons/visa-master.png" alt="فيزا/ماستركارد" className="h-8" />
                        <img src="/payment-icons/benefit.png" alt="بنفت" className="h-8" />
                        <img src="/payment-icons/knet.png" alt="كي نت" className="h-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer kept similar to the one in other pages */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">معلومات المتجر</h3>
              <p className="mb-2">{storeData?.store_name}</p>
              <p className="mb-2">{storeData?.phone_number}</p>
              <p>{storeData?.country || 'الكويت'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">روابط مهمة</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:underline">عن المتجر</a></li>
                <li><a href="#" className="hover:underline">سياسة الخصوصية</a></li>
                <li><a href="#" className="hover:underline">شروط الاستخدام</a></li>
                <li><a href="#" className="hover:underline">اتصل بنا</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4">تابعنا</h3>
              <div className="flex space-x-4 rtl:space-x-reverse">
                <a href="#" className="hover:text-primary">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="hover:text-primary">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="hover:text-primary">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p>&copy; {new Date().getFullYear()} {storeData?.store_name}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CartPage;
