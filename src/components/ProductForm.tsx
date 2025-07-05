import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk harus diisi"),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0, "Kuantitas tidak boleh negatif"),
  min_quantity: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

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

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

export function ProductForm({ isOpen, onClose, onSuccess, product }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      category: product?.category || "",
      quantity: product?.quantity || 0,
      min_quantity: product?.min_quantity || 0,
      price: product?.price || 0,
      description: product?.description || "",
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      if (isEdit && product) {
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            sku: data.sku || null,
            category: data.category || null,
            quantity: data.quantity,
            min_quantity: data.min_quantity || null,
            price: data.price || null,
            description: data.description || null,
          })
          .eq('id', product.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Produk berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: data.name,
            sku: data.sku || null,
            category: data.category || null,
            quantity: data.quantity,
            min_quantity: data.min_quantity || null,
            price: data.price || null,
            description: data.description || null,
          });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Produk berhasil ditambahkan",
        });
      }

      reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan produk",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui informasi produk" : "Tambahkan produk baru ke inventaris"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Masukkan nama produk"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              {...register("sku")}
              placeholder="Masukkan SKU produk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="Masukkan kategori produk"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Kuantitas *</Label>
              <Input
                id="quantity"
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_quantity">Stok Minimum</Label>
              <Input
                id="min_quantity"
                type="number"
                {...register("min_quantity", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Harga</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Masukkan deskripsi produk"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : isEdit ? "Perbarui" : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}