
import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Truck, Package, Clock, MapPin, Info, Zap, CheckCircle, PlusCircle, Target, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StoreShippingSettings, DeliveryArea, getShippingSettings, saveShippingSettings, getDeliveryAreas, saveDeliveryAreas } from "@/services/shipping-service";
import useStoreData from "@/hooks/use-store-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ShippingMethodFormProps {
  isPaidPlan: boolean;
}

// قائمة المحافظات في الكويت
const kuwaitGovernorates = [
  { name: "العاصمة", price: 2 },
  { name: "حولي", price: 2 },
  { name: "الفروانية", price: 3 },
  { name: "الأحمدي", price: 3 },
  { name: "الجهراء", price: 4 },
  { name: "مبارك الكبير", price: 3 }
];

// قائمة أمثلة لمناطق إضافية يمكن إضافتها
const suggestedAreas = [
  "الشويخ",
  "السالمية",
  "الصباحية",
  "الفحيحيل",
  "المنقف",
  "الجابرية",
  "الرقة",
  "الفنطاس",
  "العارضية",
  "خيطان",
  "الصليبية",
  "الوفرة"
];

const ShippingMethodForm: React.FC<ShippingMethodFormProps> = ({
  isPaidPlan
}) => {
  const {
    data: storeData
  } = useStoreData();

  // حالة نظام التوصيل: إما توصيل المتجر (storeDelivery) أو توصيل فريق برونز (bronzeDelivery)
  const [storeDelivery, setStoreDelivery] = useState(true);
  const [bronzeDelivery, setBronzeDelivery] = useState(false);

  // إعدادات توصيل المتجر (الافتراضي)
  const [freeShipping, setFreeShipping] = useState(false);
  const [freeShippingMinOrder, setFreeShippingMinOrder] = useState("100");
  const [standardDeliveryTime, setStandardDeliveryTime] = useState("2-3");
  const [deliveryTimeUnit, setDeliveryTimeUnit] = useState("days");

  // إدارة مناطق التوصيل للمتجر
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaPrice, setNewAreaPrice] = useState("5");
  const [suggestedAreaFilter, setSuggestedAreaFilter] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");

  // حالة توصيل فريق برونز
  const [selectedDeliverySpeed, setSelectedDeliverySpeed] = useState("standard");

  // حالة التحميل
  const [isLoading, setIsLoading] = useState(false);

  // جلب الإعدادات عند تحميل المكون
  useEffect(() => {
    const fetchSettings = async () => {
      if (storeData?.id) {
        setIsLoading(true);

        // جلب إعدادات الشحن
        const settings = await getShippingSettings(storeData.id);
        if (settings) {
          setStoreDelivery(settings.shipping_method === 'store_delivery');
          setBronzeDelivery(settings.shipping_method === 'bronze_delivery');
          setFreeShipping(settings.free_shipping);
          setFreeShippingMinOrder(settings.free_shipping_min_order.toString());
          setStandardDeliveryTime(settings.standard_delivery_time);
          setDeliveryTimeUnit(settings.delivery_time_unit);
          setSelectedDeliverySpeed(settings.bronze_delivery_speed);
        }

        // جلب مناطق التوصيل
        const areas = await getDeliveryAreas(storeData.id);
        if (areas.length > 0) {
          setDeliveryAreas(areas);
        } else {
          // إنشاء مناطق افتراضية من المحافظات إذا لم تكن موجودة
          setDeliveryAreas(kuwaitGovernorates.map(area => ({
            store_id: storeData.id,
            name: area.name,
            price: area.price,
            enabled: true
          })));
        }
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [storeData?.id]);

  // تعامل مع تبديل طريقة التوصيل
  const handleBronzeDeliveryChange = (checked: boolean) => {
    setBronzeDelivery(checked);
    setStoreDelivery(!checked);
    if (checked) {
      toast.success("تم تفعيل خدمة توصيل فريق برونز بنجاح");
    } else {
      toast.success("تم العودة إلى نظام توصيل المتجر");
    }
  };
  const handleStoreDeliveryChange = (checked: boolean) => {
    setStoreDelivery(checked);
    setBronzeDelivery(!checked);
    if (checked) {
      toast.success("تم تفعيل نظام توصيل المتجر بنجاح");
    } else {
      toast.success("تم تفعيل خدمة توصيل فريق برونز");
    }
  };

  // إدارة مناطق التوصيل
  const handleAreaPriceChange = (areaId: string, price: string) => {
    setDeliveryAreas(deliveryAreas.map(area => area.id === areaId ? {
      ...area,
      price: parseFloat(price) || 0
    } : area));
  };
  
  const handleAreaToggle = (areaId: string, isEnabled: boolean) => {
    setDeliveryAreas(deliveryAreas.map(area => area.id === areaId ? {
      ...area,
      enabled: isEnabled
    } : area));
  };
  
  const handleAddNewArea = () => {
    if (!newAreaName.trim()) {
      toast.error("يرجى إدخال اسم المنطقة");
      return;
    }

    // التحقق من وجود المنطقة مسبقًا
    const areaExists = deliveryAreas.some(area => area.name.trim().toLowerCase() === newAreaName.trim().toLowerCase());
    if (areaExists) {
      toast.error("هذه المنطقة موجودة بالفعل");
      return;
    }
    
    const newArea: DeliveryArea = {
      store_id: storeData?.id || "",
      name: newAreaName.trim(),
      price: parseFloat(newAreaPrice) || 0,
      enabled: true
    };
    
    setDeliveryAreas([...deliveryAreas, newArea]);
    setNewAreaName("");
    setNewAreaPrice("5");
    toast.success("تمت إضافة المنطقة بنجاح");
  };
  
  const handleRemoveArea = (areaId: string) => {
    setDeliveryAreas(deliveryAreas.filter(area => area.id !== areaId));
    toast.success("تم حذف المنطقة بنجاح");
  };

  // إضافة منطقة من الاقتراحات
  const handleAddSuggestedArea = () => {
    if (selectedSuggestion) {
      // التحقق من وجود المنطقة مسبقًا
      const areaExists = deliveryAreas.some(area => area.name.trim().toLowerCase() === selectedSuggestion.trim().toLowerCase());
      if (areaExists) {
        toast.error("هذه المنطقة موجودة بالفعل");
        return;
      }
      
      const newArea: DeliveryArea = {
        store_id: storeData?.id || "",
        name: selectedSuggestion,
        price: parseFloat(newAreaPrice) || 0,
        enabled: true
      };
      
      setDeliveryAreas([...deliveryAreas, newArea]);
      setSelectedSuggestion("");
      setNewAreaPrice("5");
      toast.success("تمت إضافة المنطقة بنجاح");
    }
  };

  // المناطق المقترحة المصفاة
  const filteredSuggestions = suggestedAreas.filter(area => 
    !deliveryAreas.some(existingArea => existingArea.name.toLowerCase() === area.toLowerCase()) &&
    area.toLowerCase().includes(suggestedAreaFilter.toLowerCase())
  );

  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    if (!storeData?.id) {
      toast.error("لم يتم العثور على معرف المتجر");
      return;
    }
    setIsLoading(true);
    try {
      // تجهيز إعدادات الشحن
      const shippingSettings: StoreShippingSettings = {
        store_id: storeData.id,
        shipping_method: storeDelivery ? 'store_delivery' : 'bronze_delivery',
        free_shipping: freeShipping,
        free_shipping_min_order: parseFloat(freeShippingMinOrder) || 0,
        standard_delivery_time: standardDeliveryTime,
        delivery_time_unit: deliveryTimeUnit as 'hours' | 'days',
        bronze_delivery_speed: selectedDeliverySpeed as 'standard' | 'express' | 'same_day'
      };

      // حفظ إعدادات الشحن
      const settingsSaved = await saveShippingSettings(shippingSettings);
      if (settingsSaved && storeDelivery) {
        // إذا كان توصيل المتجر مفعل، نقوم بحفظ مناطق التوصيل
        const areasWithStoreId = deliveryAreas.map(area => ({
          ...area,
          store_id: storeData.id
        }));
        await saveDeliveryAreas(areasWithStoreId);
      }
      toast.success("تم حفظ إعدادات الشحن بنجاح");
    } catch (error) {
      console.error("خطأ في حفظ الإعدادات:", error);
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2">جاري تحميل الإعدادات...</span>
      </div>;
  }
  
  return <div className="space-y-6">
      {/* نظام التوصيل الرئيسي - اختيار بين توصيل المتجر أو فريق برونز */}
      <Card className="border-primary/10 bg-white shadow-sm">
        <CardHeader>
          
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* توصيل المتجر (الافتراضي) */}
            <Card className={`relative cursor-pointer transition-all duration-300 p-1 ${storeDelivery ? "ring-2 ring-blue-500 bg-blue-50" : "opacity-80 hover:opacity-100"}`} onClick={() => handleStoreDeliveryChange(true)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">نظام توصيل المتجر</h3>
                  </div>
                  <Switch checked={storeDelivery} onCheckedChange={handleStoreDeliveryChange} aria-label="تفعيل نظام توصيل المتجر" />
                </div>
                <p className="text-sm text-blue-700 mb-2">تحكم كامل في عمليات التوصيل وتحديد المناطق والأسعار</p>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">الوضع الافتراضي</Badge>
              </CardContent>
            </Card>
            
            {/* توصيل فريق برونز */}
            <Card className={`relative cursor-pointer transition-all duration-300 p-1 ${bronzeDelivery ? "ring-2 ring-green-500 bg-green-50" : "opacity-80 hover:opacity-100"}`} onClick={() => handleBronzeDeliveryChange(true)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">توصيل فريق برونز</h3>
                  </div>
                  <Switch checked={bronzeDelivery} onCheckedChange={handleBronzeDeliveryChange} aria-label="تفعيل خدمة برونز" />
                </div>
                <p className="text-sm text-green-700 mb-2">خدمة توصيل متكاملة تُدار بواسطة فريق برونز</p>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">موصى به</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* تفاصيل نظام التوصيل المختار */}
      {/* نظام توصيل المتجر */}
      {storeDelivery && <div className="space-y-5">
          <div className="rounded-lg border border-blue-200 bg-white shadow-md">
            <div className="p-5 border-b border-blue-100">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">إعدادات توصيل المتجر</h3>
              <p className="text-blue-700">تحكم في أسعار ومناطق التوصيل الخاصة بمتجرك</p>
            </div>
            
            <div className="p-5 space-y-6">
              {/* التوصيل المجاني */}
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-800">التوصيل المجاني</h4>
                    <p className="text-sm text-blue-600">تقديم توصيل مجاني للطلبات التي تتجاوز قيمة معينة</p>
                  </div>
                </div>
                <Switch checked={freeShipping} onCheckedChange={setFreeShipping} aria-label="تفعيل الشحن المجاني" />
              </div>
              
              {freeShipping && <div className="border border-blue-100 rounded-lg p-4 bg-white">
                  <Label htmlFor="min-order-free-shipping" className="text-blue-800 font-medium mb-2 block">
                    الحد الأدنى للطلب للشحن المجاني (KWD)
                  </Label>
                  <div className="relative">
                    <Input id="min-order-free-shipping" type="number" className="pl-12 text-xl font-semibold dir-ltr" value={freeShippingMinOrder} onChange={e => setFreeShippingMinOrder(e.target.value)} />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      KWD
                    </div>
                  </div>
                </div>}
              
              {/* وقت التوصيل */}
              <div className="border border-blue-100 rounded-lg p-4 bg-white">
                <Label htmlFor="delivery-time" className="text-blue-800 font-medium mb-2 block">
                  مدة التوصيل
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input id="delivery-time" type="text" className="pl-4 text-xl font-semibold dir-ltr" value={standardDeliveryTime} onChange={e => setStandardDeliveryTime(e.target.value)} placeholder="1-2" />
                  </div>
                  <div className="w-1/3">
                    <Select value={deliveryTimeUnit} onValueChange={setDeliveryTimeUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="وحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">أيام</SelectItem>
                        <SelectItem value="hours">ساعات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  يمكنك استخدام نطاق مثل "1-2" أو "2-3" أو قيمة محددة مثل "24" أو "اليوم" حسب احتياجك
                </p>
              </div>
              
              {/* مناطق التوصيل */}
              <div className="border border-blue-100 rounded-lg bg-white">
                <div className="p-4 border-b border-blue-100">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>مناطق التوصيل</span>
                  </h4>
                </div>
                
                <div className="p-3">
                  <div className="space-y-3 max-h-80 overflow-y-auto p-2">
                    {/* عرض المحافظات */}
                    <div className="mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">المحافظات</h5>
                      <div className="space-y-2">
                        {deliveryAreas.filter(area => 
                          kuwaitGovernorates.some(gov => gov.name === area.name)
                        ).map((area, index) => (
                          <div key={area.id || `gov-area-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-blue-50 bg-blue-25">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                checked={area.enabled} 
                                onCheckedChange={checked => handleAreaToggle(area.id || `gov-area-${index}`, checked === true)} 
                                id={`area-${area.id || index}`} 
                              />
                              <Label 
                                htmlFor={`area-${area.id || index}`} 
                                className={`font-medium ${area.enabled ? 'text-blue-800' : 'text-gray-500'}`}
                              >
                                {area.name}
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-28">
                                <div className="relative">
                                  <Input 
                                    type="number" 
                                    className="pl-10 text-base font-semibold dir-ltr" 
                                    value={area.price.toString()} 
                                    onChange={e => handleAreaPriceChange(area.id || `gov-area-${index}`, e.target.value)} 
                                    disabled={!area.enabled} 
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-sm">
                                    KWD
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* عرض المناطق الإضافية */}
                    {deliveryAreas.filter(area => 
                      !kuwaitGovernorates.some(gov => gov.name === area.name)
                    ).length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-900 mb-2">المناطق الإضافية</h5>
                        <div className="space-y-2">
                          {deliveryAreas.filter(area => 
                            !kuwaitGovernorates.some(gov => gov.name === area.name)
                          ).map((area, index) => (
                            <div key={area.id || `custom-area-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-blue-50 bg-blue-25">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={area.enabled} 
                                  onCheckedChange={checked => handleAreaToggle(area.id || `custom-area-${index}`, checked === true)} 
                                  id={`area-${area.id || index}`} 
                                />
                                <Label 
                                  htmlFor={`area-${area.id || index}`} 
                                  className={`font-medium ${area.enabled ? 'text-blue-800' : 'text-gray-500'}`}
                                >
                                  {area.name}
                                </Label>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="w-28">
                                  <div className="relative">
                                    <Input 
                                      type="number" 
                                      className="pl-10 text-base font-semibold dir-ltr" 
                                      value={area.price.toString()} 
                                      onChange={e => handleAreaPriceChange(area.id || `custom-area-${index}`, e.target.value)} 
                                      disabled={!area.enabled} 
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-sm">
                                      KWD
                                    </div>
                                  </div>
                                </div>
                                
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50" 
                                  onClick={() => handleRemoveArea(area.id || `custom-area-${index}`)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* إضافة مناطق جديدة */}
                    <div className="mt-6">
                      <h5 className="font-medium text-blue-900 mb-2">إضافة منطقة جديدة</h5>
                      <div className="border border-blue-100 rounded-lg p-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="new-area-name" className="block text-sm font-medium text-gray-700 mb-1">
                              اسم المنطقة
                            </Label>
                            <Input 
                              id="new-area-name" 
                              value={newAreaName} 
                              onChange={e => setNewAreaName(e.target.value)} 
                              placeholder="أدخل اسم المنطقة" 
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="new-area-price" className="block text-sm font-medium text-gray-700 mb-1">
                              سعر التوصيل (KWD)
                            </Label>
                            <div className="relative">
                              <Input 
                                id="new-area-price" 
                                type="number" 
                                className="pl-10 text-base font-semibold dir-ltr" 
                                value={newAreaPrice} 
                                onChange={e => setNewAreaPrice(e.target.value)} 
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-sm">
                                KWD
                              </div>
                            </div>
                          </div>
                          
                          <Button type="button" onClick={handleAddNewArea} className="mt-2">
                            <PlusCircle className="h-4 w-4 ml-1" /> إضافة المنطقة
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* اقتراحات المناطق */}
                    <div className="mt-6">
                      <h5 className="font-medium text-blue-900 mb-2">مناطق مقترحة</h5>
                      <div className="border border-blue-100 rounded-lg p-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="suggested-area-filter" className="block text-sm font-medium text-gray-700 mb-1">
                              البحث في المناطق المقترحة
                            </Label>
                            <Input 
                              id="suggested-area-filter" 
                              value={suggestedAreaFilter} 
                              onChange={e => setSuggestedAreaFilter(e.target.value)} 
                              placeholder="ابحث عن منطقة..." 
                            />
                          </div>
                          
                          <div className="max-h-40 overflow-y-auto border rounded p-2">
                            {filteredSuggestions.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {filteredSuggestions.map((area, index) => (
                                  <div 
                                    key={`suggestion-${index}`}
                                    className={`p-2 rounded cursor-pointer text-center transition-colors ${selectedSuggestion === area ? 'bg-blue-100 text-blue-800' : 'hover:bg-blue-50'}`}
                                    onClick={() => setSelectedSuggestion(area)}
                                  >
                                    {area}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-2 text-gray-500">
                                لا توجد مناطق مقترحة متاحة
                              </div>
                            )}
                          </div>
                          
                          {selectedSuggestion && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">المنطقة المختارة:</span>
                                <Badge>{selectedSuggestion}</Badge>
                              </div>
                              
                              <div className="mb-2">
                                <Label htmlFor="suggested-area-price" className="block text-sm font-medium text-gray-700 mb-1">
                                  سعر التوصيل (KWD)
                                </Label>
                                <div className="relative">
                                  <Input 
                                    id="suggested-area-price" 
                                    type="number" 
                                    className="pl-10 text-base font-semibold dir-ltr" 
                                    value={newAreaPrice} 
                                    onChange={e => setNewAreaPrice(e.target.value)} 
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 text-sm">
                                    KWD
                                  </div>
                                </div>
                              </div>
                              
                              <Button type="button" onClick={handleAddSuggestedArea} className="w-full">
                                <PlusCircle className="h-4 w-4 ml-1" /> إضافة {selectedSuggestion}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}
      
      {/* توصيل فريق برونز */}
      {bronzeDelivery && <div className="rounded-lg border border-green-300 bg-white shadow-md">
          <div className="p-5 border-b border-green-100">
            <h3 className="text-xl font-semibold text-green-800 mb-2">خدمة توصيل فريق برونز</h3>
            <p className="text-green-700">خدمة متكاملة لتوصيل طلبات متجرك بواسطة فريق برونز</p>
          </div>
          
          <div className="p-5">
            <Alert className="bg-green-50 border-green-200 mb-6">
              <AlertCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">معلومات هامة</AlertTitle>
              <AlertDescription className="text-green-700">
                جميع الطلبات ستُحول تلقائياً إلى لوحة تحكم فريق برونز
              </AlertDescription>
            </Alert>
            
            <div className="space-y-5">
              <div className="text-base font-medium mb-2 text-green-800">سرعة التوصيل:</div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className={`border-green-200 transition-all cursor-pointer hover:shadow-md ${selectedDeliverySpeed === "standard" ? "bg-green-50 ring-2 ring-green-500" : ""}`} onClick={() => setSelectedDeliverySpeed("standard")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">توصيل قياسي</span>
                      <span className="text-green-700 font-bold">
                        <span className="text-xl ltr:inline-block">2-3</span> أيام
                      </span>
                    </div>
                    {selectedDeliverySpeed === "standard" && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
                  </CardContent>
                </Card>
                
                <Card className={`border-green-200 transition-all cursor-pointer hover:shadow-md ${selectedDeliverySpeed === "express" ? "bg-green-50 ring-2 ring-green-500" : ""}`} onClick={() => setSelectedDeliverySpeed("express")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">توصيل سريع</span>
                      <span className="text-green-700 font-bold">
                        <span className="text-xl ltr:inline-block">24</span> ساعة
                      </span>
                    </div>
                    {selectedDeliverySpeed === "express" && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
                  </CardContent>
                </Card>
                
                <Card className={`border-green-200 transition-all cursor-pointer hover:shadow-md ${selectedDeliverySpeed === "same_day" ? "bg-green-50 ring-2 ring-green-500" : ""}`} onClick={() => setSelectedDeliverySpeed("same_day")}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">توصيل في نفس اليوم</span>
                      <span className="text-green-700 font-bold">
                        <span className="text-xl ltr:inline-block">3-5</span> ساعات
                      </span>
                    </div>
                    {selectedDeliverySpeed === "same_day" && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="border-green-200 mt-4">
                <CardContent className="p-4 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="font-medium">تغطية شاملة لجميع مناطق الكويت</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>}
      
      <div className="flex justify-end">
        <Button type="button" onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700" size="lg" disabled={isLoading}>
          {isLoading ? <>
              <span className="animate-spin mr-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
              جاري الحفظ...
            </> : <>
              <Save className="h-4 w-4 ml-1" />
              حفظ التغييرات
            </>}
        </Button>
      </div>
    </div>;
};
export default ShippingMethodForm;
