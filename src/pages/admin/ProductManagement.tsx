import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Tag, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_days: number;
  requirements: string[];
  features: string[];
  assessment_type: string;
  sort_order: number;
  is_active: boolean;
  product_categories?: ProductCategory;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  // Form state for product creation/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    currency: 'THB',
    duration_days: 365,
    requirements: '',
    features: '',
    assessment_type: 'onsite',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch products with categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            name,
            description
          )
        `)
        .order('sort_order', { ascending: true });

      if (productsError) throw productsError;
      
      // Transform the data to ensure requirements and features are string arrays
      const transformedProducts = (productsData || []).map(product => ({
        ...product,
        requirements: Array.isArray(product.requirements) 
          ? product.requirements.filter((r): r is string => typeof r === 'string')
          : [],
        features: Array.isArray(product.features) 
          ? product.features.filter((f): f is string => typeof f === 'string')
          : [],
        // Ensure product_categories has all required fields
        product_categories: product.product_categories ? {
          ...product.product_categories,
          sort_order: 0,
          is_active: true
        } : undefined
      })) as Product[];
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : [],
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "สำเร็จ",
          description: "อัปเดตสินค้าเรียบร้อยแล้ว",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;

        toast({
          title: "สำเร็จ",
          description: "เพิ่มสินค้าใหม่เรียบร้อยแล้ว",
        });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price,
      currency: product.currency,
      duration_days: product.duration_days,
      requirements: Array.isArray(product.requirements) ? product.requirements.join('\n') : '',
      features: Array.isArray(product.features) ? product.features.join('\n') : '',
      assessment_type: product.assessment_type,
      sort_order: product.sort_order,
      is_active: product.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบสินค้าเรียบร้อยแล้ว",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      price: 0,
      currency: 'THB',
      duration_days: 365,
      requirements: '',
      features: '',
      assessment_type: 'onsite',
      sort_order: 0,
      is_active: true
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">จัดการสินค้าและบริการ</h1>
          <p className="text-muted-foreground">จัดการสินค้าและบริการ GACP ทั้งหมด</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มสินค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลสินค้าหรือบริการ GACP
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อสินค้า *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">หมวดหมู่ *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">ราคา (บาท) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_days">ระยะเวลา (วัน)</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 365 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment_type">ประเภทการประเมิน</Label>
                  <Select
                    value={formData.assessment_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assessment_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">ตรวจสอบในพื้นที่</SelectItem>
                      <SelectItem value="online">ตรวจสอบออนไลน์</SelectItem>
                      <SelectItem value="hybrid">ผสมผสาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">เงื่อนไขและเอกสารที่ต้องการ (แยกแต่ละบรรทัด)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  rows={3}
                  placeholder="เอกสารหนึ่ง&#10;เอกสารสอง&#10;..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">คุณสมบัติและประโยชน์ (แยกแต่ละบรรทัด)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                  rows={3}
                  placeholder="คุณสมบัติหนึ่ง&#10;คุณสมบัติสอง&#10;..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">ลำดับการแสดง</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">เปิดใช้งาน</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">
                  {editingProduct ? 'อัปเดต' : 'เพิ่ม'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="เลือกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.product_categories && (
                    <Badge variant="secondary" className="mt-1">
                      <Tag className="h-3 w-3 mr-1" />
                      {product.product_categories.name}
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.description && (
                <CardDescription className="mb-4">
                  {product.description}
                </CardDescription>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ราคา</span>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="font-semibold">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ระยะเวลา</span>
                  <span className="text-sm">
                    {Math.floor(product.duration_days / 365)} ปี
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ประเภท</span>
                  <Badge variant={
                    product.assessment_type === 'onsite' ? 'default' :
                    product.assessment_type === 'online' ? 'secondary' : 'outline'
                  }>
                    {product.assessment_type === 'onsite' ? 'ตรวจสอบในพื้นที่' :
                     product.assessment_type === 'online' ? 'ตรวจสอบออนไลน์' : 'ผสมผสาน'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">สถานะ</span>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">คุณสมบัติ</p>
                    <div className="space-y-1">
                      {product.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          {feature}
                        </div>
                      ))}
                      {product.features.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          และอีก {product.features.length - 3} รายการ...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">ไม่พบสินค้า</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' 
              ? 'ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหา'
              : 'ยังไม่มีสินค้าในระบบ'
            }
          </p>
        </div>
      )}
    </div>
  );
}