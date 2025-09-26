import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Award, Shield, Users, CheckCircle, Clock, FileText, Calendar } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  published_at: string;
  image_url?: string;
  category?: string;
  featured: boolean;
}

const HomePage = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    certifiedFarms: 0,
    activeUsers: 0
  });

  useEffect(() => {
    loadContent();
    loadStats();
  }, []);

  const loadContent = async () => {
    try {
      // Mock news data - in real implementation, this would come from CMS
      const mockNews = [
        {
          id: '1',
          title: 'ประกาศเปิดรับสมัครใบรับรอง GACP รอบใหม่',
          content: 'กรมวิชาการเกษตร เปิดรับสมัครใบรับรอง GACP สำหรับฟาร์มเกษตรอินทรีย์ รอบที่ 2/2568',
          published_at: '2024-01-15',
          category: 'ประกาศ',
          featured: true,
          image_url: '/api/placeholder/400/200'
        },
        {
          id: '2',
          title: 'อบรมเชิงปฏิบัติการ GACP ออนไลน์',
          content: 'จัดอบรมออนไลน์สำหรับเกษตรกรที่สนใจสมัครใบรับรอง GACP ทุกวันศุกร์',
          published_at: '2024-01-10',
          category: 'อบรม',
          featured: false
        },
        {
          id: '3',
          title: 'ข่าวดี! ลดค่าธรรมเนียมการสมัคร 20%',
          content: 'ในโอกาสปีใหม่ 2568 ทางกรมฯ ขอลดค่าธรรมเนียมการสมัครใบรับรอง GACP',
          published_at: '2024-01-01',
          category: 'โปรโมชั่น',
          featured: true
        }
      ];
      setNews(mockNews);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!supabase) {
      // Set default values when Supabase is not configured
      setStats({
        totalApplications: 0,
        certifiedFarms: 0,
        activeUsers: 0
      });
      return;
    }

    try {
      // Load basic stats
      const { data: applications } = await supabase
        .from('applications')
        .select('id, status');
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');

      setStats({
        totalApplications: applications?.length || 0,
        certifiedFarms: applications?.filter(app => app.status === 'CERTIFIED').length || 0,
        activeUsers: profiles?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default values on error
      setStats({
        totalApplications: 0,
        certifiedFarms: 0,
        activeUsers: 0
      });
    }
  };

  const featuredNews = news.filter(item => item.featured);
  const regularNews = news.filter(item => !item.featured);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-slate-50 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Shield className="w-4 h-4 mr-2" />
                ระบบรับรองมาตรฐาน GACP
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              ระบบใบรับรอง
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {" "}GACP{" "}
              </span>
              ออนไลน์
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              สมัครใบรับรองมาตรฐานการปฏิบัติทางการเกษตรที่ดี (Good Agricultural Practices) 
              ผ่านระบบออนไลน์ที่สะดวก รวดเร็ว และโปร่งใส
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Button 
                  asChild 
                  size="lg" 
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Link to={`/${user.profile?.role || 'applicant'}/dashboard`}>
                    <Users className="w-5 h-5 mr-2" />
                    เข้าสู่ระบบ
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    asChild 
                    size="lg" 
                    className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    <Link to="/login">
                      <Users className="w-5 h-5 mr-2" />
                      เข้าสู่ระบบ
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 text-lg font-semibold border-2 border-emerald-200 hover:border-emerald-300"
                  >
                    <Link to="/register">
                      <FileText className="w-5 h-5 mr-2" />
                      สมัครสมาชิก
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalApplications.toLocaleString()}</h3>
              <p className="text-gray-600">ใบสมัครทั้งหมด</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.certifiedFarms.toLocaleString()}</h3>
              <p className="text-gray-600">ฟาร์มที่ได้รับรอง</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.activeUsers.toLocaleString()}</h3>
              <p className="text-gray-600">ผู้ใช้งานทั้งหมด</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured News Section */}
      {featuredNews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">ข่าวสารเด่น</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                ติดตามข่าวสารและประกาศสำคัญเกี่ยวกับระบบใบรับรอง GACP
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNews.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image_url && (
                    <div className="h-48 bg-gradient-to-br from-emerald-100 to-blue-100"></div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(item.published_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {item.content}
                    </CardDescription>
                    <Button variant="ghost" className="mt-4 p-0 h-auto text-emerald-600 hover:text-emerald-700">
                      อ่านต่อ
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process Steps Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">ขั้นตอนการสมัคร</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              กระบวนการสมัครใบรับรอง GACP ที่เข้าใจง่าย
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: 'สมัครสมาชิก',
                description: 'ลงทะเบียนและยืนยันตัวตน',
                icon: Users,
                color: 'emerald'
              },
              {
                step: 2,
                title: 'ส่งเอกสาร',
                description: 'อัพโหลดเอกสารที่จำเป็น',
                icon: FileText,
                color: 'blue'
              },
              {
                step: 3,
                title: 'ตรวจประเมิน',
                description: 'ผู้เชี่ยวชาญตรวจสอบ',
                icon: CheckCircle,
                color: 'purple'
              },
              {
                step: 4,
                title: 'รับใบรับรอง',
                description: 'ดาวน์โหลดใบรับรอง',
                icon: Award,
                color: 'orange'
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-16 h-16 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                </div>
                <div className={`text-2xl font-bold text-${item.color}-600 mb-2`}>
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regular News Section */}
      {regularNews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">ข่าวสารทั่วไป</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularNews.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(item.published_at).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="line-clamp-2">
                      {item.content}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button asChild variant="outline">
                <Link to="/news">
                  ดูข่าวสารทั้งหมด
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            พร้อมเริ่มต้นการสมัครใบรับรอง GACP แล้วหรือยัง?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">
            เริ่มต้นการเดินทางสู่มาตรฐานการปฏิบัติทางการเกษตรที่ดี วันนี้
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                variant="secondary" 
                className="bg-white text-emerald-600 hover:bg-gray-100"
              >
                <Link to="/register">
                  เริ่มต้นสมัคร
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-emerald-600"
              >
                <Link to="/about">
                  เรียนรู้เพิ่มเติม
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;