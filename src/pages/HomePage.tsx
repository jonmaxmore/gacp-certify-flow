import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Users, FileText, Award, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_CATEGORIES, WORKFLOW_STEPS, THAI_REGULATIONS } from '@/lib/constants';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published_at: string;
  featured: boolean;
}

const HomePage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeFarmers: 0,
    certificatesIssued: 0
  });

  useEffect(() => {
    loadNews();
    loadStats();
  }, []);

  const loadNews = async () => {
    if (!supabase) return;
    
    try {
      // Mock data since cms_content table may not exist yet
      setNews([
        {
          id: '1',
          title: 'ประกาศเปิดรับสมัครรับรองมาตรฐาน GACP ประจำปี 2567',
          content: 'กรมการแพทย์แผนไทยฯ เปิดรับสมัครเกษตรกรเข้าร่วมโครงการรับรองมาตรฐาน GACP',
          published_at: new Date().toISOString(),
          featured: true
        }
      ]);
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadStats = async () => {
    if (!supabase) return;
    
    try {
      const [applicationsResult, farmersResult, certificatesResult] = await Promise.all([
        supabase.from('applications').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer' as any),
        supabase.from('certificates').select('id', { count: 'exact' }).eq('is_active', true)
      ]);

      setStats({
        totalApplications: applicationsResult.count || 0,
        activeFarmers: farmersResult.count || 0,
        certificatesIssued: certificatesResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm font-medium">
              {THAI_REGULATIONS.department}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            ระบบรับรอง <span className="text-primary">GACP</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            ระบบการปฏิบัติทางการเกษตรที่ดีสำหรับยาสมุนไพร 
            ยกระดับคุณภาพผลผลิตสู่มาตรฐานสากล
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/farmer/login">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="mr-2 h-5 w-5" />
                เข้าสู่ระบบเกษตรกร
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dept/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <FileText className="mr-2 h-5 w-5" />
                เข้าสู่ระบบเจ้าหน้าที่
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.totalApplications}</div>
                <div className="text-sm text-slate-600">ใบสมัครทั้งหมด</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.activeFarmers}</div>
                <div className="text-sm text-slate-600">เกษตรกรที่เข้าร่วม</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.certificatesIssued}</div>
                <div className="text-sm text-slate-600">ใบรับรองที่ออก</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">ประเภทผลิตภัณฑ์ที่รับรอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
              <Card key={key} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">{category.description}</p>
                  <div className="text-xs text-slate-500">
                    <strong>ข้อกำหนด:</strong>
                    <ul className="mt-1 space-y-1">
                      {category.requirements.slice(0, 2).map((req, idx) => (
                        <li key={idx}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">ขั้นตอนการรับรอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-4">
            {Object.entries(WORKFLOW_STEPS).map(([step, info], index) => (
              <div key={step} className="relative">
                <Card className="p-4 text-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                    {step}
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{info.name}</h3>
                  <p className="text-xs text-slate-600">{info.description}</p>
                </Card>
                {index < Object.keys(WORKFLOW_STEPS).length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">ข่าวสารและประกาศ</h2>
            <Link to="/news">
              <Button variant="outline">ดูทั้งหมด</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                {item.image_url && (
                  <div className="aspect-video bg-slate-200 rounded-t-lg overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3">{item.content}</p>
                  <div className="mt-4 text-xs text-slate-500">
                    {new Date(item.published_at).toLocaleDateString('th-TH')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">ต้องการความช่วยเหลือ?</h2>
          <p className="text-slate-300 mb-8">
            ทีมงานของเราพร้อมให้คำปรึกษาและช่วยเหลือตลอด 24 ชั่วโมง
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg">
              <MessageSquare className="mr-2 h-5 w-5" />
              แชทสด
            </Button>
            <Button variant="outline" size="lg">
              โทร 1669
            </Button>
          </div>
        </div>
      </section>

      {/* PDPA Notice */}
      <section className="py-8 px-4 bg-slate-100 border-t">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-slate-600">
            เว็บไซต์นี้ปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 
            ข้อมูลของท่านจะได้รับการคุ้มครองตามมาตรฐานสากล
          </p>
          <Link to="/privacy" className="text-primary hover:underline text-sm">
            นโยบายความเป็นส่วนตัว
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;