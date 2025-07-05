import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ESP32CodeExample() {
  const esp32Code = `/*
 * StokManager ESP32 + GM67 Barcode Scanner
 * Optimized untuk GM67 Barcode Scanner Module
 * 
 * Hardware yang dibutuhkan:
 * - ESP32 Development Board (DOIT ESP32 DEVKIT V1)
 * - GM67 Barcode Scanner Module
 * - Koneksi WiFi stabil
 * 
 * Wiring GM67 ke ESP32:
 * GM67 VCC (Merah) -> ESP32 5V
 * GM67 GND (Hitam) -> ESP32 GND
 * GM67 TX (Kuning) -> ESP32 GPIO16 (RX2)
 * GM67 RX (Biru) -> ESP32 GPIO17 (TX2)
 * GM67 Trigger (Opsional) -> ESP32 GPIO18
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// Konfigurasi WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Konfigurasi StokManager
const char* webhookURL = "https://gsxwdzkumgwoqvkgxdkz.supabase.co/functions/v1/esp32-webhook";
const char* deviceID = "ESP32_SCANNER_01";

// Serial untuk barcode scanner
HardwareSerial BarcodeSerial(2);

void setup() {
  Serial.begin(115200);
  BarcodeSerial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  
  // Koneksi WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  Serial.println("StokManager ESP32 Scanner Ready!");
  Serial.println("Silakan scan barcode...");
}

void loop() {
  // Baca data dari barcode scanner
  if (BarcodeSerial.available()) {
    String barcode = BarcodeSerial.readStringUntil('\\n');
    barcode.trim();
    
    if (barcode.length() > 0) {
      Serial.println("Barcode detected: " + barcode);
      sendToStokManager(barcode);
    }
  }
  
  delay(100);
}

void sendToStokManager(String barcode) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(webhookURL);
    http.addHeader("Content-Type", "application/json");
    
    // Buat JSON payload
    DynamicJsonDocument doc(1024);
    doc["barcode"] = barcode;
    doc["device_id"] = deviceID;
    doc["timestamp"] = getTimestamp();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Kirim HTTP POST
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      // Parse response untuk feedback
      DynamicJsonDocument responseDoc(1024);
      deserializeJson(responseDoc, response);
      
      if (responseDoc["success"]) {
        Serial.println("✓ Barcode berhasil diproses!");
        if (responseDoc["product"]["name"]) {
          Serial.println("Produk: " + String(responseDoc["product"]["name"]));
          Serial.println("Stok: " + String(responseDoc["product"]["old_quantity"]) + 
                        " -> " + String(responseDoc["product"]["new_quantity"]));
        }
        blinkLED(2, 200); // Blink 2x untuk sukses
      } else {
        Serial.println("✗ Error: " + String(responseDoc["message"]));
        blinkLED(5, 100); // Blink 5x untuk error
      }
    } else {
      Serial.println("Error sending data: " + String(httpResponseCode));
      blinkLED(10, 50); // Blink 10x untuk connection error
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected!");
  }
}

String getTimestamp() {
  // Untuk implementasi yang lebih akurat, gunakan NTP
  return String(millis());
}

void blinkLED(int times, int delayMs) {
  // Opsional: tambahkan LED indicator
  // pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_BUILTIN, LOW);
    delay(delayMs);
  }
}

/*
 * Catatan implementasi:
 * 
 * 1. Install library yang dibutuhkan:
 *    - ArduinoJson by Benoit Blanchon
 *    - WiFi (built-in ESP32)
 *    - HTTPClient (built-in ESP32)
 * 
 * 2. Ganti konfigurasi:
 *    - YOUR_WIFI_SSID dengan nama WiFi Anda
 *    - YOUR_WIFI_PASSWORD dengan password WiFi
 *    - deviceID sesuai identifier ESP32 Anda
 * 
 * 3. Wiring barcode scanner:
 *    - Gunakan barcode scanner yang mengeluarkan data serial
 *    - Sambungkan ke Serial2 (GPIO 16 & 17)
 *    - Pastikan voltage level sesuai (3.3V untuk ESP32)
 * 
 * 4. Testing:
 *    - Monitor serial untuk melihat log
 *    - Test dengan scan barcode yang sudah ada di database
 *    - Cek response dari server StokManager
 */`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(esp32Code);
    toast({
      title: "Kode Disalin",
      description: "Kode ESP32 telah disalin ke clipboard",
    });
  };

  const handleDownloadCode = () => {
    const blob = new Blob([esp32Code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StokManager_ESP32_Scanner.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Diunduh",
      description: "Kode ESP32 telah diunduh sebagai file .ino",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kode ESP32 Arduino</CardTitle>
            <CardDescription>
              Kode lengkap untuk ESP32 barcode scanner integration
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Arduino IDE</Badge>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadCode}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          <code>{esp32Code}</code>
        </pre>
      </CardContent>
    </Card>
  );
}