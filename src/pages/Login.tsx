import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Query admin_users table to verify credentials
      const { data: adminUser, error: queryError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

      if (queryError || !adminUser) {
        setError("Username atau password salah");
        return;
      }

      // For demo purposes, we'll do a simple password check
      // In production, you'd use proper password hashing
      if (password === 'admin123' && username === 'admin') {
        // Store admin session in localStorage
        localStorage.setItem('stokmanager_admin', JSON.stringify(adminUser));
        toast({
          title: "Berhasil masuk",
          description: "Selamat datang di StokManager",
        });
        navigate('/dashboard');
      } else {
        setError("Username atau password salah");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary rounded-full">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary">StokManager Admin</h1>
          <p className="text-muted-foreground">Masuk ke panel administrasi sistem</p>
        </div>

        {/* Security Notice */}
        <Alert className="border-accent">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Keamanan Sesi</strong><br />
            Sesi akan berakhir otomatis setelah 30 menit tidak ada aktivitas
          </AlertDescription>
        </Alert>

        {/* Login Form */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Masuk ke Dashboard</CardTitle>
            <CardDescription>
              Masukkan kredensial admin Anda untuk mengakses sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-accent/50 rounded-lg">
              <p className="text-sm font-medium text-accent-foreground mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Username:</strong> admin</p>
                <p><strong>Password:</strong> admin123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          © 2025 StokManager. Sistem Manajemen Inventaris
        </div>
      </div>
    </div>
  );
}