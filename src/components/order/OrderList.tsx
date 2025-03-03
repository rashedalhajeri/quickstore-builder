import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, ChevronDown, ChevronUp, Eye, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Sample order data
const orders = [
  {
    id: "ORD-001",
    customer: "أحمد محمد",
    date: new Date("2023-06-15"),
    total: 245.99,
    status: "completed",
    items: 3,
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "ORD-002",
    customer: "سارة علي",
    date: new Date("2023-06-14"),
    total: 125.50,
    status: "processing",
    items: 2,
    paymentMethod: "دفع عند الاستلام",
  },
  {
    id: "ORD-003",
    customer: "محمد خالد",
    date: new Date("2023-06-13"),
    total: 540.00,
    status: "shipped",
    items: 5,
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "ORD-004",
    customer: "فاطمة أحمد",
    date: new Date("2023-06-12"),
    total: 75.25,
    status: "cancelled",
    items: 1,
    paymentMethod: "دفع عند الاستلام",
  },
  {
    id: "ORD-005",
    customer: "عمر حسن",
    date: new Date("2023-06-11"),
    total: 320.75,
    status: "completed",
    items: 4,
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "ORD-006",
    customer: "نورا سعيد",
    date: new Date("2023-06-10"),
    total: 180.00,
    status: "processing",
    items: 2,
    paymentMethod: "دفع عند الاستلام",
  },
  {
    id: "ORD-007",
    customer: "خالد محمود",
    date: new Date("2023-06-09"),
    total: 420.50,
    status: "shipped",
    items: 3,
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "ORD-008",
    customer: "ليلى عبدالله",
    date: new Date("2023-06-08"),
    total: 95.99,
    status: "completed",
    items: 1,
    paymentMethod: "دفع عند الاستلام",
  },
  {
    id: "ORD-009",
    customer: "يوسف أحمد",
    date: new Date("2023-06-07"),
    total: 275.25,
    status: "cancelled",
    items: 3,
    paymentMethod: "بطاقة ائتمان",
  },
  {
    id: "ORD-010",
    customer: "هدى محمد",
    date: new Date("2023-06-06"),
    total: 150.00,
    status: "processing",
    items: 2,
    paymentMethod: "دفع عند الاستلام",
  },
];

// Status badge colors
const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

// Status translations
const statusTranslations = {
  completed: "مكتمل",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  cancelled: "ملغي",
};

// Currency symbols mapping
const currencySymbols: Record<string, string> = {
  KWD: "د.ك", // Kuwaiti Dinar
  SAR: "ر.س", // Saudi Riyal
  AED: "د.إ", // UAE Dirham
  QAR: "ر.ق", // Qatari Riyal
  BHD: "د.ب", // Bahraini Dinar
  OMR: "ر.ع", // Omani Riyal
  USD: "$", // US Dollar
  EUR: "€", // Euro
};

interface OrderListProps {
  searchQuery: string;
  statusFilter: string;
  dateRangeFilter: string;
  onOpenDetails: (orderId: string) => void;
  currency?: string;
}

const OrderList: React.FC<OrderListProps> = ({
  searchQuery,
  statusFilter,
  dateRangeFilter,
  onOpenDetails,
  currency = "KWD",
}) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState("");
  const itemsPerPage = 5;

  // Get currency symbol 
  const getCurrencySymbol = (currencyCode: string): string => {
    return currencySymbols[currencyCode] || currencyCode;
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !localSearchQuery ||
      order.id.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(localSearchQuery.toLowerCase());

    const matchesStatus = !localStatusFilter || order.status === localStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === "date") {
      comparison = a.date.getTime() - b.date.getTime();
    } else if (sortField === "total") {
      comparison = a.total - b.total;
    } else if (sortField === "id") {
      comparison = a.id.localeCompare(b.id);
    } else if (sortField === "customer") {
      comparison = a.customer.localeCompare(b.customer);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sort indicator
  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن طلب..."
            className="pl-8"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
        <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="حالة الطلب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="processing">قيد المعالجة</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  className="font-medium"
                  onClick={() => handleSort("id")}
                >
                  رقم الطلب
                  <SortIndicator field="id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-medium"
                  onClick={() => handleSort("customer")}
                >
                  العميل
                  <SortIndicator field="customer" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-medium"
                  onClick={() => handleSort("date")}
                >
                  التاريخ
                  <SortIndicator field="date" />
                </Button>
              </TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="font-medium"
                  onClick={() => handleSort("total")}
                >
                  المبلغ
                  <SortIndicator field="total" />
                </Button>
              </TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    {format(order.date, "d MMMM yyyy", { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[order.status as keyof typeof statusColors]}
                    >
                      {statusTranslations[order.status as keyof typeof statusTranslations]}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.total.toFixed(2)} {getCurrencySymbol(currency)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDetails(order.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  لا توجد طلبات متطابقة مع معايير البحث
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default OrderList;
