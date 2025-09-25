import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Search, Clock } from 'lucide-react';

const NewsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock news data
  const newsItems = [
    {
      id: 1,
      title: 'เปิดรับสมัครขอรับรองมาตรฐาน GACP ประจำปี 2024',
      excerpt: 'เปิดรับสมัครเกษตรกรและผู้ประกอบการเพื่อขอรับรองมาตรฐาน GACP สำหรับผลิตภัณฑ์เกษตรปลอดภัย',
      date: '2024-01-15',
      category: 'ประกาศ',
      readTime: '3 นาที',
      image: '/api/placeholder/400/200'
    },
    {
      id: 2,
      title: 'อบรมออนไลน์: หลักการปฏิบัติทางการเกษตรที่ดี',
      excerpt: 'จัดอบรมออนไลน์เรื่องหลักการและแนวปฏิบัติที่ดีในการเกษตรตามมาตรฐาน GACP',
      date: '2024-01-10',
      category: 'การอบรม',
      readTime: '5 นาที',
      image: '/api/placeholder/400/200'
    },
    {
      id: 3,
      title: 'ผลการประเมินมาตรฐาน GACP ไตรมาสที่ 4/2023',
      excerpt: 'สรุปผลการประเมินและการออกใบรับรองมาตรฐาน GACP ในช่วงไตรมาสที่ 4 ของปี 2023',
      date: '2024-01-05',
      category: 'รายงาน',
      readTime: '7 นาที',
      image: '/api/placeholder/400/200'
    },
    {
      id: 4,
      title: 'เทคโนโลยีใหม่ในการตรวจสอบคุณภาพผลผลิตเกษตร',
      excerpt: 'นำเสนอเทคโนโลยีและนวัตกรรมใหม่ๆ ที่ช่วยในการตรวจสอบและรับรองคุณภาพผลผลิตเกษตร',
      date: '2023-12-28',
      category: 'นวัตกรรม',
      readTime: '6 นาที',
      image: '/api/placeholder/400/200'
    },
    {
      id: 5,
      title: 'แนวทางการเตรียมความพร้อมสำหรับการตรวจประเมิน',
      excerpt: 'คำแนะนำและแนวทางในการเตรียมความพร้อมของฟาร์มและสถานประกอบการก่อนการตรวจประเมิน',
      date: '2023-12-20',
      category: 'คู่มือ',
      readTime: '8 นาที',
      image: '/api/placeholder/400/200'
    },
    {
      id: 6,
      title: 'ความร่วมมือระหว่างประเทศในการพัฒนามาตรฐานเกษตรปลอดภัย',
      excerpt: 'การลงนามบันทึกข้อตกลงความร่วมมือกับองค์การระหว่างประเทศเพื่อพัฒนามาตรฐานเกษตร',
      date: '2023-12-15',
      category: 'ความร่วมมือ',
      readTime: '4 นาที',
      image: '/api/placeholder/400/200'
    }
  ];

  const categories = ['ทั้งหมด', 'ประกาศ', 'การอบรม', 'รายงาน', 'นวัตกรรม', 'คู่มือ', 'ความร่วมมือ'];
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  const filteredNews = newsItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">ข่าวสารและกิจกรรม</h1>
        <p className="text-xl text-muted-foreground">
          ติดตามข่าวสาร อัพเดท และกิจกรรมต่างๆ เกี่ยวกับมาตรฐาน GACP
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="ค้นหาข่าวสาร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((item) => (
          <Card key={item.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <Badge 
                variant="secondary" 
                className="absolute top-2 left-2 bg-background/80 text-foreground"
              >
                {item.category}
              </Badge>
            </div>
            
            <CardHeader className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {item.title}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {item.excerpt}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(item.date).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{item.readTime}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                อ่านต่อ
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">ไม่พบข่าวสารที่ตรงกับการค้นหา</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ทั้งหมด');
            }}
            className="mt-4"
          >
            ล้างตัวกรอง
          </Button>
        </div>
      )}

      {/* Load More */}
      {filteredNews.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            โหลดข่าวสารเพิ่มเติม
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsPage;