import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Eye, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  featured: boolean;
  published: boolean;
  published_at: string;
  image_url?: string;
  author_id: string;
  created_at: string;
  updated_at: string;
}

const NewsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    featured: false,
    published: false,
    image_url: ''
  });

  // Mock data for demo
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      
      // Mock news data - in real implementation, this would come from Supabase
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'ประกาศเปิดรับสมัครใบรับรอง GACP รอบใหม่',
          content: 'กรมวิชาการเกษตร เปิดรับสมัครใบรับรอง GACP สำหรับฟาร์มเกษตรอินทรีย์ รอบที่ 2/2568 โดยมีรายละเอียดดังนี้...',
          excerpt: 'เปิดรับสมัครใบรับรอง GACP รอบใหม่สำหรับฟาร์มเกษตรอินทรีย์',
          category: 'ประกาศ',
          featured: true,
          published: true,
          published_at: '2024-01-15T10:00:00Z',
          image_url: '/api/placeholder/400/200',
          author_id: user?.id || '',
          created_at: '2024-01-15T09:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          title: 'อบรมเชิงปฏิบัติการ GACP ออนไลน์',
          content: 'จัดอบรมออนไลน์สำหรับเกษตรกรที่สนใจสมัครใบรับรอง GACP ทุกวันศุกร์ เวลา 13:00-16:00 น.',
          excerpt: 'อบรมออนไลน์สำหรับเกษตรกรที่สนใจสมัครใบรับรอง GACP',
          category: 'อบรม',
          featured: false,
          published: true,
          published_at: '2024-01-10T13:00:00Z',
          author_id: user?.id || '',
          created_at: '2024-01-10T12:00:00Z',
          updated_at: '2024-01-10T13:00:00Z'
        },
        {
          id: '3',
          title: 'ข่าวดี! ลดค่าธรรมเนียมการสมัคร 20%',
          content: 'ในโอกาสปีใหม่ 2568 ทางกรมฯ ขอลดค่าธรรมเนียมการสมัครใบรับรอง GACP ลง 20% สำหรับผู้สมัครใหม่',
          excerpt: 'ลดค่าธรรมเนียมการสมัครใบรับรอง GACP ลง 20%',
          category: 'โปรโมชั่น',
          featured: true,
          published: false,
          published_at: '2024-01-01T00:00:00Z',
          author_id: user?.id || '',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];
      
      setNews(mockNews);
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข่าวสารได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const newsItem: NewsItem = {
        id: selectedNews?.id || Date.now().toString(),
        ...formData,
        author_id: user?.id || '',
        created_at: selectedNews?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: formData.published ? new Date().toISOString() : ''
      };

      if (selectedNews) {
        // Update existing
        setNews(prev => prev.map(item => item.id === selectedNews.id ? newsItem : item));
        toast({
          title: "อัพเดทสำเร็จ",
          description: "ข่าวสารได้รับการอัพเดทแล้ว",
        });
      } else {
        // Create new
        setNews(prev => [newsItem, ...prev]);
        toast({
          title: "สร้างสำเร็จ",
          description: "ข่าวสารใหม่ได้รับการสร้างแล้ว",
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving news:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข่าวสารได้",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setNews(prev => prev.filter(item => item.id !== id));
      toast({
        title: "ลบสำเร็จ",
        description: "ข่าวสารได้รับการลบแล้ว",
      });
    } catch (error) {
      console.error('Error deleting news:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข่าวสารได้",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      excerpt: newsItem.excerpt || '',
      category: newsItem.category,
      featured: newsItem.featured,
      published: newsItem.published,
      image_url: newsItem.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedNews(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      featured: false,
      published: false,
      image_url: ''
    });
  };

  const handleNewNews = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">จัดการข่าวสาร</h2>
          <p className="text-muted-foreground">สร้างและจัดการข่าวสารสำหรับหน้าแรก</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewNews}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มข่าวใหม่
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedNews ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวใหม่'}
              </DialogTitle>
              <DialogDescription>
                กรอกข้อมูลข่าวสารที่ต้องการแสดงบนหน้าแรก
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">หัวข้อข่าว</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="หัวข้อข่าวสาร"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="excerpt">สรุปข่าว</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="สรุปสั้นๆ ของข่าว"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">หมวดหมู่</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ประกาศ">ประกาศ</SelectItem>
                    <SelectItem value="ข่าวสาร">ข่าวสาร</SelectItem>
                    <SelectItem value="อบรม">อบรม</SelectItem>
                    <SelectItem value="โปรโมชั่น">โปรโมชั่น</SelectItem>
                    <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">URL รูปภาพ</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">เนื้อหา</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="เนื้อหาข่าวสาร"
                  rows={8}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">ข่าวเด่น</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                  />
                  <Label htmlFor="published">เผยแพร่</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave}>
                  {selectedNews ? 'อัพเดท' : 'สร้าง'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {news.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                  {item.featured && (
                    <Badge variant="secondary">
                      <Star className="w-3 h-3 mr-1" />
                      เด่น
                    </Badge>
                  )}
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? 'เผยแพร่' : 'ร่าง'}
                  </Badge>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardDescription className="flex items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(item.updated_at).toLocaleDateString('th-TH')}
                </span>
                {item.published && (
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    เผยแพร่แล้ว
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 mb-4">
                {item.excerpt || item.content}
              </p>
              
              {item.image_url && (
                <div className="w-full h-32 bg-gray-100 rounded-md mb-4"></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีข่าวสาร</h3>
            <p className="text-gray-500 text-center mb-4">
              เริ่มต้นสร้างข่าวสารแรกสำหรับหน้าแรกของเว็บไซต์
            </p>
            <Button onClick={handleNewNews}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มข่าวใหม่
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsManager;