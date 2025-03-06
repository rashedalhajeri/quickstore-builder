
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle } from "lucide-react";
import { StoreFormData } from "../types";
import { supabase } from "@/integrations/supabase/client";

interface BasicInfoStepProps {
  formData: StoreFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  domainAvailable: boolean | null;
  setDomainAvailable: (available: boolean | null) => void;
  checkingDomain: boolean;
  setCheckingDomain: (checking: boolean) => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  handleChange,
  handleSelectChange,
  domainAvailable,
  setDomainAvailable,
  checkingDomain,
  setCheckingDomain,
}) => {
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Automatically check domain availability when domainName changes
  useEffect(() => {
    if (!formData.domainName || formData.domainName.length < 3) {
      setDomainAvailable(null);
      return;
    }

    // Validate domain name format first (alphanumeric and hyphens only)
    const domainRegex = /^[a-zA-Z0-9-]+$/;
    if (!domainRegex.test(formData.domainName)) {
      setDomainAvailable(false);
      return;
    }

    // Debounce the domain availability check to avoid too many requests
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    setCheckingDomain(true);
    const timeout = setTimeout(async () => {
      try {
        // Check if domain already exists in database
        const { data, error } = await supabase
          .from('stores')
          .select('domain_name')
          .eq('domain_name', formData.domainName)
          .maybeSingle();

        if (error) throw error;
        
        // If data is null, domain is available
        setDomainAvailable(!data);
      } catch (error) {
        console.error("Error checking domain:", error);
        setDomainAvailable(null);
      } finally {
        setCheckingDomain(false);
      }
    }, 500); // 500ms debounce delay

    setDebounceTimeout(timeout);

    // Cleanup on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [formData.domainName, setDomainAvailable, setCheckingDomain]);

  // Handle domain name input change
  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">المعلومات الأساسية</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storeName">اسم المتجر <span className="text-red-500">*</span></Label>
          <Input
            id="storeName"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            placeholder="أدخل اسم المتجر"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="domainName">اسم النطاق <span className="text-red-500">*</span></Label>
          <div className="flex items-center">
            <div className={`flex flex-1 items-center rounded-md border ${
              domainAvailable === true 
                ? 'border-green-500 bg-green-50' 
                : domainAvailable === false 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300'
            }`}>
              <Input
                id="domainName"
                name="domainName"
                value={formData.domainName}
                onChange={handleDomainChange}
                placeholder="example"
                className={`flex-1 border-0 rounded-none focus-visible:ring-0 ${
                  domainAvailable === true 
                    ? 'bg-green-50 text-green-800' 
                    : domainAvailable === false 
                      ? 'bg-red-50 text-red-800' 
                      : 'bg-white'
                }`}
                required
              />
              <span className="px-3 text-gray-500 whitespace-nowrap">.linok.me</span>
            </div>
          </div>
          {checkingDomain && (
            <p className="text-gray-500 text-sm">جاري التحقق...</p>
          )}
          {domainAvailable === true && !checkingDomain && (
            <p className="text-green-600 text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> اسم النطاق متاح
            </p>
          )}
          {domainAvailable === false && !checkingDomain && (
            <p className="text-red-600 text-sm flex items-center">
              <XCircle className="h-4 w-4 mr-1" /> اسم النطاق غير متاح، الرجاء اختيار اسم آخر
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">رقم الهاتف <span className="text-red-500">*</span></Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+965 xxxxxxxx"
            required
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">الدولة</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
              disabled
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="اختر الدولة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kuwait">الكويت</SelectItem>
                <SelectItem value="Saudi Arabia" disabled>السعودية (قريباً)</SelectItem>
                <SelectItem value="UAE" disabled>الإمارات (قريباً)</SelectItem>
                <SelectItem value="Qatar" disabled>قطر (قريباً)</SelectItem>
                <SelectItem value="Bahrain" disabled>البحرين (قريباً)</SelectItem>
                <SelectItem value="Oman" disabled>عمان (قريباً)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">العملة</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleSelectChange("currency", value)}
              disabled
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="اختر العملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                <SelectItem value="SAR" disabled>ريال سعودي (SAR) (قريباً)</SelectItem>
                <SelectItem value="AED" disabled>درهم إماراتي (AED) (قريباً)</SelectItem>
                <SelectItem value="QAR" disabled>ريال قطري (QAR) (قريباً)</SelectItem>
                <SelectItem value="BHD" disabled>دينار بحريني (BHD) (قريباً)</SelectItem>
                <SelectItem value="OMR" disabled>ريال عماني (OMR) (قريباً)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">وصف المتجر</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="أدخل وصفاً مختصراً لمتجرك"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
