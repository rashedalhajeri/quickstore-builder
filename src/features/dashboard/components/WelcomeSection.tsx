
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StorePreviewButton from "./StorePreviewButton";

interface WelcomeSectionProps {
  storeName: string;
  ownerName: string;
  logoUrl?: string | null;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  storeName,
  ownerName,
  logoUrl
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-primary-50/80 to-primary-100/50 border-primary-100 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-300/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <CardContent className="pt-6 relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store className="h-7 w-7 text-primary-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  مرحباً
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                </h2>
                <p className="text-muted-foreground mt-1 text-gray-700">
                  {storeName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <StorePreviewButton />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WelcomeSection;
