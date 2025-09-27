import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  name_en: string;
  category: keyof typeof PRODUCT_CATEGORIES;
  description: string;
  description_en: string;
  requirements: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    category: 'cannabis' as keyof typeof PRODUCT_CATEGORIES,
    description: '',
    description_en: '',
    requirements: [''],
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผลิตภัณฑ์ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      category: 'cannabis',
      description: '',
      description_en: '',
      requirements: [''],
      is_active: true,
      sort_order: products.length
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      name_en: product.name_en,
      category: product.category,
      description: product.description,
      description_en: product.description_en,
      requirements: product.requirements.length > 0 ? product.requirements : [''],
      is_active: product.is_active,
      sort_order: product.sort_order
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!supabase) return;
    
    if (!formData.name || !formData.description) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อและคำอธิบายผลิตภัณฑ์",
        variant: "destructive"
      });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        name_en: formData.name_en || formData.name,
        category: formData.category,
        description: formData.description,
        description_en: formData.description_en || formData.description,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        is_active: formData.is_active,
        sort_order: formData.sort_order
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        toast({
          title: "สำเร็จ",
          description: "อัปเดตผลิตภัณฑ์เรียบร้อยแล้ว"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        
        toast({
          title: "สำเร็จ",
          description: "เพิ่มผลิตภัณฑ์ใหม่เรียบร้อยแล้ว"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผลิตภัณฑ์นี้?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบผลิตภัณฑ์เรียบร้อยแล้ว"
      });

      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถลบผลิตภัณฑ์ได้",
        variant: "destructive"
      });
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">จัดการผลิตภัณฑ์</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มผลิตภัณฑ์ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'แก้ไขผลิตภัณฑ์' : 'เพิ่มผลิตภัณฑ์ใหม่'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ชื่อผลิตภัณฑ์ (ไทย) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น กัญชาทางการแพทย์"
                  />
                </div>
                <div>
                  <Label htmlFor="name_en">ชื่อผลิตภัณฑ์ (อังกฤษ)</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="e.g. Medical Cannabis"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">หมวดหมู่</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as keyof typeof PRODUCT_CATEGORIES }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">คำอธิบาย (ไทย) *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="อธิบายผลิตภัณฑ์..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="description_en">คำอธิบาย (อังกฤษ)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                    placeholder="Product description..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label>ข้อกำหนดพิเศษ</Label>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder="ข้อกำหนด..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                        disabled={formData.requirements.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRequirement}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มข้อกำหนด
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">เปิดใช้งาน</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="sort_order">ลำดับการแสดง</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  บันทึก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {PRODUCT_CATEGORIES[product.category]?.icon}
                    {product.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.name_en}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </Badge>
                
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
                
                {product.requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">ข้อกำหนด:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {product.requirements.map((req, index) => (
                        <li key={index}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  ลำดับ: {product.sort_order}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">ยังไม่มีผลิตภัณฑ์</h3>
          <p className="text-muted-foreground mb-4">
            เริ่มต้นด้วยการเพิ่มผลิตภัณฑ์แรกของคุณ
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผลิตภัณฑ์ใหม่
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;