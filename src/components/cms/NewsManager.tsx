import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  Search,
  Filter,
  Upload,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name?: string;
  tags?: string[];
}

const NewsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categories = [
    'ข่าวสาร',
    'ประกาศ', 
    'กิจกรรม',
    'อบรม',
    'มาตรฐาน',
    'อื่นๆ'
  ];

  // Initialize news data (mock data for demonstration)
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - replace with actual Supabase query
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'ประกาศหลักเกณฑ์ใหม่ GACP 2024',
          content: 'เนื้อหาประกาศหลักเกณฑ์ใหม่สำหรับการรับรอง GACP ประจำปี 2024...',
          excerpt: 'กรมวิชาการเกษตรประกาศหลักเกณฑ์ใหม่สำหรับการรับรอง GACP ประจำปี 2024',
          category: 'ประกาศ',
          status: 'published',
          published_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T08:00:00Z',
          updated_at: '2024-01-15T09:00:00Z',
          author_id: user?.id || '',
          author_name: 'ผู้ดูแลระบบ',
          tags: ['GACP', 'มาตรฐาน', '2024']
        },
        {
          id: '2',
          title: 'เปิดรับสมัครผู้ประเมิน GACP',
          content: 'รายละเอียดการสมัครเป็นผู้ประเมินคุณภาพการปฏิบัติทางการเกษตรที่ดี...',
          excerpt: 'เปิดรับสมัครผู้ประเมินคุณภาพการปฏิบัติทางการเกษตรที่ดี',
          category: 'ข่าวสาร',
          status: 'published',
          published_at: '2024-01-10T14:00:00Z',
          created_at: '2024-01-10T12:00:00Z',
          updated_at: '2024-01-10T13:00:00Z',
          author_id: user?.id || '',
          author_name: 'ผู้ดูแลระบบ',
          tags: ['สมัครงาน', 'ผู้ประเมิน']
        }
      ];
      setNews(mockNews);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลข่าวสารได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNews = async (newsData: Partial<NewsItem>) => {
    try {
      if (editingNews) {
        // Update existing news
        const updatedNews = news.map(item => 
          item.id === editingNews.id 
            ? { ...item, ...newsData, updated_at: new Date().toISOString() }
            : item
        );
        setNews(updatedNews);
        toast({
          title: "บันทึกสำเร็จ",
          description: "อัปเดตข่าวสารเรียบร้อยแล้ว",
        });
      } else {
        // Create new news
        const newNews: NewsItem = {
          id: Date.now().toString(),
          title: newsData.title || '',
          content: newsData.content || '',
          excerpt: newsData.excerpt || '',
          category: newsData.category || categories[0],
          status: newsData.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_id: user?.id || '',
          author_name: user?.profile?.full_name || 'ผู้ดูแลระบบ',
          tags: newsData.tags || []
        };
        setNews([newNews, ...news]);
        toast({
          title: "บันทึกสำเร็จ",
          description: "สร้างข่าวสารใหม่เรียบร้อยแล้ว",
        });
      }
      setIsDialogOpen(false);
      setEditingNews(null);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      setNews(news.filter(item => item.id !== id));
      toast({
        title: "ลบสำเร็จ",
        description: "ลบข่าวสารเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการข่าวสาร</h1>
          <p className="text-muted-foreground">จัดการข่าวสารและประกาศสำหรับเว็บไซต์</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingNews(null);
                setIsDialogOpen(true);
              }}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มข่าวสาร</span>
            </Button>
          </DialogTrigger>
          <NewsEditor
            news={editingNews}
            categories={categories}
            onSave={handleSaveNews}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingNews(null);
            }}
          />
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาข่าวสาร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="draft">แบบร่าง</SelectItem>
                  <SelectItem value="published">เผยแพร่แล้ว</SelectItem>
                  <SelectItem value="archived">เก็บถาวร</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">กำลังโหลด...</div>
        ) : filteredNews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">ไม่พบข่าวสาร</p>
            </CardContent>
          </Card>
        ) : (
          filteredNews.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        item.status === 'published' ? 'default' :
                        item.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {item.status === 'published' ? 'เผยแพร่แล้ว' :
                         item.status === 'draft' ? 'แบบร่าง' : 'เก็บถาวร'}
                      </Badge>
                      <Badge variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {item.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.excerpt}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.created_at).toLocaleDateString('th-TH')}</span>
                      </span>
                      <span>โดย {item.author_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Preview functionality
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNews(item);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNews(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// News Editor Component
interface NewsEditorProps {
  news: NewsItem | null;
  categories: string[];
  onSave: (data: Partial<NewsItem>) => void;
  onCancel: () => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ news, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: news?.title || '',
    content: news?.content || '',
    excerpt: news?.excerpt || '',
    category: news?.category || categories[0],
    status: news?.status || 'draft',
    tags: news?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{news ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่'}</DialogTitle>
        <DialogDescription>
          กรอกข้อมูลข่าวสารและประกาศ
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">หัวข้อ *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="หัวข้อข่าวสาร"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">หมวดหมู่ *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">สรุปเนื้อหา *</Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="สรุปเนื้อหาสั้นๆ สำหรับแสดงในหน้าหลัก"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">เนื้อหา *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="เนื้อหาข่าวสารฉบับเต็ม"
            rows={10}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tags">แท็ก</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="แท็ก1, แท็ก2, แท็ก3"
            />
            <p className="text-xs text-muted-foreground">แยกแท็กด้วยเครื่องหมายจุลภาค</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">สถานะ *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as NewsItem['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">แบบร่าง</SelectItem>
                <SelectItem value="published">เผยแพร่</SelectItem>
                <SelectItem value="archived">เก็บถาวร</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            บันทึก
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default NewsManager;