import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    if (req.method === 'POST') {
      const { barcode, device_id, timestamp } = await req.json()
      
      console.log('ESP32 Data received:', { barcode, device_id, timestamp })

      // Cari produk berdasarkan barcode (SKU)
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('sku', barcode)
        .single()

      if (productError || !product) {
        console.log('Product not found for barcode:', barcode)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Produk tidak ditemukan',
            barcode 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        )
      }

      // Catat pergerakan inventory
      const { error: movementError } = await supabaseClient
        .from('inventory_movements')
        .insert({
          product_id: product.id,
          movement_type: 'out', // Default untuk scanning adalah keluar
          quantity: 1,
          notes: `Scanned by ESP32 device: ${device_id}`,
          esp32_device_id: device_id
        })

      if (movementError) {
        console.error('Error recording movement:', movementError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Gagal mencatat pergerakan' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }

      // Update stock quantity
      const newQuantity = Math.max(0, product.quantity - 1)
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', product.id)

      if (updateError) {
        console.error('Error updating stock:', updateError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Barcode berhasil diproses',
          product: {
            name: product.name,
            sku: product.sku,
            old_quantity: product.quantity,
            new_quantity: newQuantity,
            category: product.category
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // GET request untuk testing
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          message: 'ESP32 Webhook endpoint is active',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error) {
    console.error('ESP32 webhook error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})