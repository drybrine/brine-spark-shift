import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Wifi, WifiOff, Scan, Package, Clock, CheckCircle, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ESP32CodeExample } from "@/components/ESP32CodeExample";

interface ScannedItem {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  notes: string;
  esp32_device_id: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
    category: string;
    quantity: number;
  };
}

export default function Scanner() {
  const navigate = useNavigate();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('stokmanager_admin');
    if (!adminData) {
      navigate('/login');
      return;
    }

    // Fetch recent scanned items
    fetchScannedItems();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('inventory-movements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_movements'
        },
        (payload) => {
          console.log('New scan detected:', payload);
          handleNewScan(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          toast({
            title: "Terhubung",
            description: "Sistem scanning ESP32 siap digunakan",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchScannedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products (
            name,
            sku,
            category,
            quantity
          )
        `)
        .not('esp32_device_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching scanned items:', error);
        return;
      }

      setScannedItems(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = async (newMovement: any) => {
    // Fetch the complete data with product info
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        products (
          name,
          sku,
          category,
          quantity
        )
      `)
      .eq('id', newMovement.id)
      .single();

    if (!error && data) {
      setScannedItems(prev => [data, ...prev.slice(0, 19)]);
      
      toast({
        title: "Barcode Terdeteksi!",
        description: `${data.products.name} berhasil dipindai`,
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  const formatDate = (timestamp: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(timestamp));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary">Barcode Scanner</h1>
            <p className="text-sm text-muted-foreground">
              Monitor aktivitas scanning ESP32 secara real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Wifi className="h-3 w-3 mr-1" />
                Terhubung
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <WifiOff className="h-3 w-3 mr-1" />
                Tidak Terhubung
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Setup & Status */}
          <div className="space-y-6">
            {/* ESP32 Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Konfigurasi ESP32
                </CardTitle>
                <CardDescription>
                  Endpoint untuk menghubungkan ESP32 barcode scanner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    <strong>Webhook URL:</strong><br />
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      https://gsxwdzkumgwoqvkgxdkz.supabase.co/functions/v1/esp32-webhook
                    </code>
                    <br /><br />
                    <strong>Method:</strong> POST<br />
                    <strong>Content-Type:</strong> application/json<br />
                    <strong>Body format:</strong><br />
                    <code className="bg-muted px-2 py-1 rounded text-sm block mt-1">
                      {`{"barcode": "SKU_CODE", "device_id": "ESP32_01", "timestamp": "ISO_TIME"}`}
                    </code>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status Koneksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8">
                  {isConnected ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wifi className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-green-800">Terhubung</h3>
                      <p className="text-sm text-green-600">Real-time monitoring aktif</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <WifiOff className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-medium text-red-800">Tidak Terhubung</h3>
                      <p className="text-sm text-red-600">Menunggu koneksi ESP32</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Scanning Terbaru</CardTitle>
              <CardDescription>
                Riwayat barcode yang dipindai dengan ESP32
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scannedItems.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {scannedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.products.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{item.products.sku}</Badge>
                            <span>•</span>
                            <span>{item.products.category}</span>
                            <span>•</span>
                            <span>Stok: {item.products.quantity}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Device: {item.esp32_device_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 mb-1">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Berhasil</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(item.created_at)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scan className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Belum Ada Aktivitas</h3>
                  <p className="text-muted-foreground">
                    Mulai scan barcode dengan ESP32 untuk melihat aktivitas di sini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ESP32 Code Example */}
        <ESP32CodeExample />
      </div>
    </div>
  );
}