import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Package, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const adminData = localStorage.getItem('stokmanager_admin');
    if (adminData) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary rounded-full">
              <Package className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-4">StokManager</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sistem Manajemen Inventaris Modern
          </p>
          <Button size="lg" onClick={() => navigate('/login')}>
            <Shield className="h-5 w-5 mr-2" />
            Masuk ke Admin Panel
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Manajemen Stok</CardTitle>
              <CardDescription>
                Kelola inventaris dengan mudah dan efisien
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Pantau stok produk, atur minimum stok, dan kelola kategori dengan antarmuka yang intuitif.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Laporan Real-time</CardTitle>
              <CardDescription>
                Dapatkan insight mendalam tentang inventaris Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Analisis stok, nilai inventaris, dan pergerakan barang dengan laporan yang komprehensif.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Keamanan Tinggi</CardTitle>
              <CardDescription>
                Sistem keamanan berlapis untuk melindungi data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Autentikasi admin yang aman dengan sesi timeout otomatis dan enkripsi data.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-muted-foreground">
          <p>© 2025 StokManager. Sistem Manajemen Inventaris</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
