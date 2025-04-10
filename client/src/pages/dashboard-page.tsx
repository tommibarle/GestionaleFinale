import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  PackageOpen, 
  ShoppingCart, 
  AlertTriangle,
  EuroIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-mobile";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import DashboardCard from "@/components/dashboard-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArticleWithStatus, OrderWithProducts } from "@shared/schema";

interface DashboardData {
  totalArticles: number;
  totalProducts: number;
  totalOrders: number;
  totalOrdersValue: number;
  lowStockArticles: ArticleWithStatus[];
  recentOrders: OrderWithProducts[];
}

const DashboardPage = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user } = useAuth();
  const [lowStockCount, setLowStockCount] = useState(0);

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  useEffect(() => {
    if (data?.lowStockArticles) {
      setLowStockCount(data.lowStockArticles.length);
    }
  }, [data]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completato";
      case "pending":
        return "In corso";
      case "cancelled":
        return "Annullato";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getArticleStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "out":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getArticleStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponibile";
      case "low":
        return "Sotto soglia";
      case "critical":
        return "Critico";
      case "out":
        return "Esaurito";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobile={isMobile} />
      
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Header title="Dashboard" notifications={lowStockCount} />
        
        <section className="p-3 md:p-6">
          <div className="container mx-auto">
            {data?.lowStockArticles && data.lowStockArticles.length > 0 && (
              <div className="mb-4 md:mb-6">
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Attenzione</AlertTitle>
                  <AlertDescription>
                    {data.lowStockArticles.length} articoli sono sotto la soglia minima di stock.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <DashboardCard
                title="Articoli totali"
                value={isLoading ? "..." : data?.totalArticles || 0}
                icon={<Package size={20} />}
                trend={{ value: "+3 nell'ultimo mese", isPositive: true }}
              />
              
              <DashboardCard
                title="Prodotti totali"
                value={isLoading ? "..." : data?.totalProducts || 0}
                icon={<PackageOpen size={20} />}
                trend={{ value: "+2 nell'ultimo mese", isPositive: true }}
              />
              
              <DashboardCard
                title="Ordini totali"
                value={isLoading ? "..." : data?.totalOrders || 0}
                icon={<ShoppingCart size={20} />}
                trend={{ value: "+15 nell'ultimo mese", isPositive: true }}
              />
              
              <DashboardCard
                title="Totale ordini"
                value={isLoading ? "..." : `€ ${data?.totalOrdersValue.toLocaleString() || 0}`}
                icon={<EuroIcon size={20} />}
                trend={{ value: "+8% nell'ultimo mese", isPositive: true }}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-neutral-800">Ultimi Ordini</h3>
                  <Link href="/ordini" className="text-primary text-xs md:text-sm hover:underline">Vedi tutti</Link>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">ID</TableHead>
                        <TableHead className="text-xs md:text-sm">Data</TableHead>
                        <TableHead className="text-xs md:text-sm">Prodotti</TableHead>
                        <TableHead className="text-xs md:text-sm">Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs md:text-sm">Caricamento...</TableCell>
                        </TableRow>
                      ) : data?.recentOrders && data.recentOrders.length > 0 ? (
                        data.recentOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">{order.code}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">{formatDate(order.createdAt)}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">{order.products.length} prodotti</TableCell>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs md:text-sm">Nessun ordine recente</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-3 md:p-5">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-neutral-800">Articoli Sotto Soglia</h3>
                  <Link href="/articoli" className="text-primary text-xs md:text-sm hover:underline">Gestisci articoli</Link>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs md:text-sm">Articolo</TableHead>
                        <TableHead className="text-xs md:text-sm">Quantità</TableHead>
                        <TableHead className="text-xs md:text-sm">Soglia</TableHead>
                        <TableHead className="text-xs md:text-sm">Stato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs md:text-sm">Caricamento...</TableCell>
                        </TableRow>
                      ) : data?.lowStockArticles && data.lowStockArticles.length > 0 ? (
                        data.lowStockArticles.map((article) => (
                          <TableRow key={article.id}>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">{article.name}</TableCell>
                            <TableCell className="whitespace-nowrap font-medium text-xs md:text-sm">{article.quantity}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">{article.threshold}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getArticleStatusBadgeClass(article.status)}`}>
                                {getArticleStatusText(article.status)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs md:text-sm">Nessun articolo sotto soglia</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
