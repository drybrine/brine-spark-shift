import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Package, TrendingUp, AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number | null;
  price: number | null;
  description: string | null;
}

interface AdminUser {
  id: string;
  username: string;
  full_name: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('stokmanager_admin');
    if (!adminData) {
      navigate('/login');
      return;
    }

    const admin = JSON.parse(adminData);
    setAdminUser(admin);

    // Fetch products
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data produk",
          variant: "destructive",
        });
        return;
      }

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stokmanager_admin');
    toast({
      title: "Berhasil keluar",
      description: "Anda telah keluar dari sistem",
    });
    navigate('/login');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getLowStockProducts = () => {
    return products.filter(product => 
      product.min_quantity && product.quantity <= product.min_quantity
    );
  };

  const getTotalValue = () => {
    return products.reduce((total, product) => {
      return total + (product.price || 0) * product.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const lowStockProducts = getLowStockProducts();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">StokManager</h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang, {adminUser?.full_name || adminUser?.username}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                Item dalam inventaris
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
              <p className="text-xs text-muted-foreground">
                Estimasi nilai inventaris
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Item perlu diisi ulang
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Daftar Produk</TabsTrigger>
            <TabsTrigger value="lowstock">Stok Rendah</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Daftar Produk</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {product.sku && <Badge variant="secondary">{product.sku}</Badge>}
                        {product.category && <span>{product.category}</span>}
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold">
                        Stok: {product.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(product.price)}
                      </div>
                      {product.min_quantity && product.quantity <= product.min_quantity && (
                        <Badge variant="destructive" className="text-xs">
                          Stok Rendah
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {products.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Belum Ada Produk</h3>
                    <p className="text-muted-foreground mb-4">
                      Mulai dengan menambahkan produk pertama Anda
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Produk
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lowstock" className="space-y-4">
            <h2 className="text-xl font-semibold">Produk dengan Stok Rendah</h2>
            
            {lowStockProducts.length > 0 ? (
              <div className="grid gap-4">
                {lowStockProducts.map((product) => (
                  <Card key={product.id} className="border-destructive">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {product.sku && <Badge variant="secondary">{product.sku}</Badge>}
                          {product.category && <span>{product.category}</span>}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-semibold text-destructive">
                          Stok: {product.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Min: {product.min_quantity}
                        </div>
                        <Badge variant="destructive">Perlu Diisi Ulang</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Semua Stok Aman</h3>
                  <p className="text-muted-foreground">
                    Tidak ada produk dengan stok rendah saat ini
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}