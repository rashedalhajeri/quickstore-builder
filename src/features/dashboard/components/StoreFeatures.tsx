
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import SaveButton from "@/components/ui/save-button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash, Star, BadgePercent, ShieldCheck, Truck } from "lucide-react";

interface StoreFeaturesProps {
  storeId: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  is_active: boolean;
}

const icons = [
  { value: 'star', label: 'نجمة', component: <Star className="h-4 w-4" /> },
  { value: 'percent', label: 'خصم', component: <BadgePercent className="h-4 w-4" /> },
  { value: 'shield', label: 'حماية', component: <ShieldCheck className="h-4 w-4" /> },
  { value: 'truck', label: 'شحن', component: <Truck className="h-4 w-4" /> },
];

const IconSelector = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
  return (
    <div className="flex gap-2">
      {icons.map((icon) => (
        <Button
          key={icon.value}
          type="button"
          variant={value === icon.value ? "default" : "outline"}
          className={`h-10 w-10 p-0 ${value === icon.value ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => onChange(icon.value)}
        >
          {icon.component}
        </Button>
      ))}
    </div>
  );
};

const StoreFeatures: React.FC<StoreFeaturesProps> = ({ storeId }) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeaturesSection, setShowFeaturesSection] = useState(true);
  
  useEffect(() => {
    if (storeId) {
      fetchFeatures();
    }
  }, [storeId]);
  
  const fetchFeatures = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_features')
        .select('*')
        .eq('store_id', storeId)
        .order('id', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setFeatures(data);
      } else {
        // Set default features if none exist
        setFeatures([
          {
            id: `temp_1`,
            icon: 'star',
            title: 'منتجات مميزة',
            description: 'نقدم لك أفضل المنتجات بأعلى جودة',
            is_active: true
          },
          {
            id: `temp_2`,
            icon: 'percent',
            title: 'خصومات دائمة',
            description: 'استمتع بخصومات حصرية على مشترياتك',
            is_active: true
          },
          {
            id: `temp_3`,
            icon: 'truck',
            title: 'شحن سريع',
            description: 'نوصل طلبك بأسرع وقت ممكن',
            is_active: true
          }
        ]);
      }
      
      // Check if the features section is enabled
      const { data: settingsData, error: settingsError } = await supabase
        .from('store_theme_settings')
        .select('show_features_section')
        .eq('store_id', storeId)
        .single();
        
      if (!settingsError && settingsData) {
        setShowFeaturesSection(settingsData.show_features_section !== false);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("حدث خطأ أثناء تحميل مميزات المتجر");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFeature = () => {
    const newFeature: Feature = {
      id: `temp_${Date.now()}`,
      icon: 'star',
      title: '',
      description: '',
      is_active: true
    };
    
    setFeatures([...features, newFeature]);
  };
  
  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    setFeatures(updatedFeatures);
  };
  
  const handleFeatureChange = (index: number, field: keyof Feature, value: any) => {
    const updatedFeatures = [...features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    setFeatures(updatedFeatures);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First, update the show_features_section setting
      const { data: settingsData, error: settingsCheckError } = await supabase
        .from('store_theme_settings')
        .select('id')
        .eq('store_id', storeId)
        .single();
      
      if (settingsCheckError && settingsCheckError.code !== 'PGRST116') {
        throw settingsCheckError;
      }
      
      if (settingsData) {
        // Update existing settings
        const { error: settingsUpdateError } = await supabase
          .from('store_theme_settings')
          .update({ show_features_section: showFeaturesSection })
          .eq('store_id', storeId);
          
        if (settingsUpdateError) throw settingsUpdateError;
      } else {
        // Insert new settings
        const { error: settingsInsertError } = await supabase
          .from('store_theme_settings')
          .insert([{ 
            store_id: storeId, 
            show_features_section: showFeaturesSection,
            theme_id: 'default',
            primary_color: '#22C55E',
            secondary_color: '#E2E8F0',
            accent_color: '#CBD5E0',
            font_family: 'default',
            layout_type: 'grid',
            products_per_row: 3
          }]);
          
        if (settingsInsertError) throw settingsInsertError;
      }
      
      // Delete all existing features
      const { error: deleteError } = await supabase
        .from('store_features')
        .delete()
        .eq('store_id', storeId);
        
      if (deleteError) throw deleteError;
      
      // Insert new features if there are any
      if (features.length > 0) {
        const featuresToInsert = features.map(feature => ({
          store_id: storeId,
          icon: feature.icon,
          title: feature.title,
          description: feature.description,
          is_active: feature.is_active
        }));
        
        const { error: insertError } = await supabase
          .from('store_features')
          .insert(featuresToInsert);
          
        if (insertError) throw insertError;
      }
      
      toast.success("تم حفظ مميزات المتجر بنجاح");
    } catch (error) {
      console.error("Error saving features:", error);
      toast.error("حدث خطأ أثناء حفظ مميزات المتجر");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">جاري تحميل مميزات المتجر...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>مميزات المتجر</CardTitle>
        <CardDescription>
          أضف مميزات متجرك التي سيتم عرضها للعملاء في صفحة المتجر
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 border p-4 rounded-md">
            <Switch 
              id="show-features"
              checked={showFeaturesSection}
              onCheckedChange={setShowFeaturesSection}
            />
            <Label htmlFor="show-features">عرض قسم المميزات في صفحة المتجر</Label>
          </div>
          
          {showFeaturesSection && (
            <div className="space-y-6 mt-6">
              {features.map((feature, index) => (
                <div key={feature.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">الميزة {index + 1}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">الأيقونة</Label>
                      <IconSelector 
                        value={feature.icon} 
                        onChange={(value) => handleFeatureChange(index, 'icon', value)} 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`feature-title-${index}`} className="mb-2 block">العنوان</Label>
                      <Input 
                        id={`feature-title-${index}`}
                        value={feature.title} 
                        onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                        placeholder="عنوان الميزة"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`feature-description-${index}`} className="mb-2 block">الوصف</Label>
                      <Textarea
                        id={`feature-description-${index}`}
                        value={feature.description}
                        onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                        placeholder="وصف الميزة"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id={`feature-active-${index}`}
                        checked={feature.is_active}
                        onCheckedChange={(checked) => handleFeatureChange(index, 'is_active', checked)}
                      />
                      <Label htmlFor={`feature-active-${index}`}>تفعيل الميزة</Label>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button 
                onClick={handleAddFeature} 
                className="w-full"
                disabled={features.length >= 4}
              >
                <Plus className="h-4 w-4 me-2" /> إضافة ميزة جديدة
              </Button>
              
              {features.length >= 4 && (
                <p className="text-xs text-muted-foreground text-center">
                  الحد الأقصى للمميزات هو 4 مميزات
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <SaveButton isSaving={isSaving} onClick={handleSave} />
      </CardFooter>
    </Card>
  );
};

export default StoreFeatures;
