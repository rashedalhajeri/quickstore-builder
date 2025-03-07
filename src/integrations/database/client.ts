
import { supabase } from "@/integrations/supabase/client";
import { Product, RawProductData } from "@/utils/products/types";
import { mapRawProductToProduct } from "@/utils/products/mappers";
import { buildProductQuery } from "@/utils/products/query-builders";
import { Database } from "@/integrations/supabase/types";

export interface DatabaseClient {
  products: {
    fetchProductsWithFilters: (
      sectionType: string,
      storeId?: string,
      categoryId?: string,
      sectionId?: string,
      limit?: number,
      includeArchived?: boolean
    ) => Promise<Product[]>;
    getProductById: (productId: string) => Promise<{ data: Product | null, error: any }>;
    updateProduct: (productId: string, updates: any) => Promise<{ data: Product[] | null, error: any }>;
    deleteProduct: (productId: string) => Promise<{ success: boolean, error: any }>;
    hardDeleteProduct: (productId: string) => Promise<{ success: boolean, error: any }>;
    archiveProduct: (productId: string, isArchived: boolean) => Promise<{ data: Product | null, error: any }>;
    bulkArchiveProducts: (productIds: string[], isArchived: boolean) => Promise<{ success: boolean, error: any }>;
    bulkDeleteProducts: (productIds: string[]) => Promise<{ success: boolean, error: any, deletedCount: number, archivedCount: number }>;
    activateProduct: (productId: string, isActive: boolean) => Promise<{ data: Product | null, error: any }>;
    bulkActivateProducts: (productIds: string[], isActive: boolean) => Promise<{ success: boolean, error: any }>;
  };
}

class SupabaseDatabaseClient implements DatabaseClient {
  products = {
    fetchProductsWithFilters: async (
      sectionType: string,
      storeId?: string,
      categoryId?: string,
      sectionId?: string,
      limit?: number,
      includeArchived: boolean = false
    ): Promise<Product[]> => {
      try {
        let query = supabase
          .from('products')
          .select('*, category:categories(name)')
          .eq('is_active', true);
          
        if (!includeArchived) {
          query = query.eq('is_archived', false);
        }

        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        if (categoryId && categoryId !== 'all' && categoryId !== 'none') {
          query = query.eq('category_id', categoryId);
        }

        if (sectionId && sectionId !== 'all' && sectionId !== 'none') {
          query = query.eq('section_id', sectionId);
        }

        switch (sectionType) {
          case 'best_selling':
            query = query.order('sales_count', { ascending: false });
            break;
          case 'new_arrivals':
            query = query.order('created_at', { ascending: false });
            break;
          case 'featured':
            query = query.eq('is_featured', true);
            break;
          case 'on_sale':
            query = query.not('discount_price', 'is', null);
            break;
          case 'category':
            break;
          case 'custom':
            break;
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        if (limit && limit > 0) {
          query = query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching products:", error);
          return [];
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        const rawData = data as unknown as RawProductData[];
        const processedProducts: Product[] = [];
        
        for (let i = 0; i < rawData.length; i++) {
          const product = mapRawProductToProduct(rawData[i]);
          processedProducts.push(product);
        }
        
        return processedProducts;
      } catch (err) {
        console.error("Error in fetchProductsWithFilters:", err);
        return [];
      }
    },

    getProductById: async (productId: string) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (error) throw error;
        
        if (!data) return { data: null, error: null };
        
        const product = mapRawProductToProduct(data as unknown as RawProductData);
        
        return { data: product, error: null };
      } catch (error) {
        console.error('Error fetching product:', error);
        return { data: null, error };
      }
    },

    updateProduct: async (productId: string, updates: any) => {
      try {
        const validUpdates = { ...updates };
        
        const { data, error } = await supabase
          .from('products')
          .update(validUpdates)
          .eq('id', productId)
          .select();
          
        if (error) throw error;
        
        const processedData: Product[] = [];
        
        if (data && data.length > 0) {
          const rawData = data as unknown as RawProductData[];
          
          for (let i = 0; i < rawData.length; i++) {
            const processed = mapRawProductToProduct(rawData[i]);
            processedData.push(processed);
          }
        }
        
        return { data: processedData, error: null };
      } catch (error) {
        console.error("Error updating product:", error);
        return { data: null, error };
      }
    },

    deleteProduct: async (productId: string) => {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
          
        return { success: !error, error };
      } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error };
      }
    },

    hardDeleteProduct: async (productId: string) => {
      try {
        const { data: orderItems, error: checkError } = await supabase
          .from('order_items')
          .select('id')
          .eq('product_id', productId)
          .limit(1);
          
        if (checkError) {
          return { success: false, error: checkError };
        }
        
        if (orderItems && orderItems.length > 0) {
          return { 
            success: false, 
            error: { message: "لا يمكن حذف المنتج لأنه مرتبط بطلبات." } 
          };
        }
        
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
          
        return { success: !error, error };
      } catch (error) {
        console.error("Error hard deleting product:", error);
        return { success: false, error };
      }
    },

    bulkDeleteProducts: async (productIds: string[]) => {
      try {
        const { data: orderItems, error: checkError } = await supabase
          .from('order_items')
          .select('product_id')
          .in('product_id', productIds);
          
        if (checkError) {
          console.error("Error checking order items:", checkError);
          return { success: false, error: checkError, deletedCount: 0, archivedCount: 0 };
        }
        
        const productsInOrders = orderItems ? Array.from(new Set(orderItems.map(item => item.product_id))) : [];
        
        const productsToDelete = productIds.filter(id => !productsInOrders.includes(id));
        
        if (productsToDelete.length === 0) {
          return { 
            success: false, 
            error: { message: "جميع المنتجات المحددة مرتبطة بطلبات ولا يمكن حذفها." },
            deletedCount: 0,
            archivedCount: 0
          };
        }
        
        let deleteError = null;
        let archiveError = null;
        let deletedCount = 0;
        let archivedCount = 0;
        
        if (productsToDelete.length > 0) {
          const { error } = await supabase
            .from('products')
            .delete()
            .in('id', productsToDelete);
            
          if (error) {
            deleteError = error;
            console.error("Error deleting products:", error);
          } else {
            deletedCount = productsToDelete.length;
          }
        }
        
        if (productsInOrders.length > 0) {
          const { error } = await supabase
            .from('products')
            .update({ is_archived: true })
            .in('id', productsInOrders);
            
          if (error) {
            archiveError = error;
            console.error("Error archiving products:", error);
          } else {
            archivedCount = productsInOrders.length;
          }
        }
        
        const success = !deleteError && !archiveError;
        const error = deleteError || archiveError || null;
        
        return { 
          success, 
          error, 
          deletedCount,
          archivedCount
        };
      } catch (error) {
        console.error("Error in bulkDeleteProducts:", error);
        return { success: false, error, deletedCount: 0, archivedCount: 0 };
      }
    },

    archiveProduct: async (productId: string, isArchived: boolean) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({ is_archived: isArchived })
          .eq('id', productId)
          .select()
          .single();
          
        if (error) throw error;
        
        if (!data) return { data: null, error: null };
        
        const product = mapRawProductToProduct(data as unknown as RawProductData);
        
        return { data: product, error: null };
      } catch (error) {
        console.error("Error archiving product:", error);
        return { data: null, error };
      }
    },

    bulkArchiveProducts: async (productIds: string[], isArchived: boolean) => {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_archived: isArchived })
          .in('id', productIds);
          
        return { success: !error, error };
      } catch (error) {
        console.error("Error bulk archiving products:", error);
        return { success: false, error };
      }
    },

    activateProduct: async (productId: string, isActive: boolean) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({ is_active: isActive })
          .eq('id', productId)
          .select()
          .single();
          
        if (error) throw error;
        
        if (!data) return { data: null, error: null };
        
        const product = mapRawProductToProduct(data as unknown as RawProductData);
        
        return { data: product, error: null };
      } catch (error) {
        console.error("Error updating product active status:", error);
        return { data: null, error };
      }
    },

    bulkActivateProducts: async (productIds: string[], isActive: boolean) => {
      try {
        const { error } = await supabase
          .from('products')
          .update({ is_active: isActive })
          .in('id', productIds);
          
        return { success: !error, error };
      } catch (error) {
        console.error("Error bulk updating products active status:", error);
        return { success: false, error };
      }
    }
  };
}

export const databaseClient: DatabaseClient = new SupabaseDatabaseClient();

export const setDatabaseClient = (mockClient: DatabaseClient) => {
  return mockClient;
};
