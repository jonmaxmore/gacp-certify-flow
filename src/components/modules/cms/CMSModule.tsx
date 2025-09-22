import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  Upload,
  Eye,
  Copy,
  BookOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SOPDocument {
  id: string;
  title: string;
  plant_type: string;
  category: 'cultivation' | 'harvesting' | 'post_harvest' | 'quality_control' | 'general';
  content: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
  file_url?: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: 'application_form' | 'assessment_form' | 'certificate' | 'report';
  description: string;
  template_data: any;
  status: 'active' | 'inactive';
}

const PLANT_TYPES = [
  'กระเทียม', 'ขิง', 'ขมิ้นชัน', 'กะเพรา', 'โหระพา', 'มะกรูด', 
  'ตะไคร้', 'ใบยี่หร่า', 'ฟ้าทะลายโจร', 'บัวบก', 'อื่นๆ'
];

const CATEGORIES = [
  { value: 'cultivation', label: 'การเพาะปลูก' },
  { value: 'harvesting', label: 'การเก็บเกี่ยว' },
  { value: 'post_harvest', label: 'หลังการเก็บเกี่ยว' },
  { value: 'quality_control', label: 'การควบคุมคุณภาพ' },
  { value: 'general', label: 'ทั่วไป' }
];

interface CMSModuleProps {
  userRole: 'admin' | 'reviewer' | 'auditor';
}

export const CMSModule: React.FC<CMSModuleProps> = ({ userRole }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'sop' | 'templates' | 'documents'>('sop');
  const [sopDocuments, setSopDocuments] = useState<SOPDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SOPDocument | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlant, setFilterPlant] = useState<string>('all');

  useEffect(() => {
    loadSOPDocuments();
    loadTemplates();
  }, []);

  const loadSOPDocuments = () => {
    // Mock SOP documents
    const mockSOPs: SOPDocument[] = [
      {
        id: '1',
        title: 'มาตรฐาน GACP สำหรับการปลูกกระเทียม',
        plant_type: 'กระเทียม',
        category: 'cultivation',
        content: `# มาตรฐาน GACP สำหรับการปลูกกระเทียม

## 1. การเตรียมดิน
- ดินต้องมีการระบายน้ำที่ดี
- pH ดินควรอยู่ในช่วง 6.0-7.0
- ไม่ควรใช้สารเคมีที่เป็นอันตรายต่อสิ่งแวดล้อม

## 2. การปลูก
- เลือกพันธุ์กระเทียมที่เหมาะสมกับสภาพดินฟ้าอากาศ
- ระยะห่างระหว่างต้น 15-20 เซนติเมตร
- ความลึกในการปลูก 3-5 เซนติเมตร`,
        version: '1.2',
        status: 'active',
        created_at: '2024-01-10',
        updated_at: '2024-01-15',
        created_by: 'Admin'
      },
      {
        id: '2',
        title: 'คู่มือการเก็บเกี่ยวขิงอย่างถูกหลัก GACP',
        plant_type: 'ขิง',
        category: 'harvesting',
        content: `# คู่มือการเก็บเกี่ยวขิงอย่างถูกหลัก GACP

## ช่วงเวลาที่เหมาะสม
- ขิงอายุ 8-10 เดือน
- เก็บเกี่ยวในช่วงเช้า เวลา 6:00-10:00 น.

## วิธีการเก็บเกี่ยว
- ใช้เครื่องมือที่สะอาดและคม
- หลีกเลี่ยงการเก็บเกี่ยวในวันฝนตก`,
        version: '1.0',
        status: 'active',
        created_at: '2024-01-12',
        updated_at: '2024-01-12',
        created_by: 'Admin'
      },
      {
        id: '3',
        title: 'การควบคุมคุณภาพหลังการเก็บเกี่ยว',
        plant_type: 'ทั่วไป',
        category: 'post_harvest',
        content: `# การควบคุมคุณภาพหลังการเก็บเกี่ยว

## การล้างและทำความสะอาด
- ใช้น้ำสะอาดในการล้าง
- แยกผลิตผลที่เสียหายออก

## การอบแห้ง
- ควบคุมอุณหภูมิไม่เกิน 60 องศาเซลเซียส
- ความชื้นสัมพัทธ์ไม่เกิน 12%`,
        version: '1.1',
        status: 'draft',
        created_at: '2024-01-14',
        updated_at: '2024-01-20',
        created_by: 'Admin'
      }
    ];
    setSopDocuments(mockSOPs);
  };

  const loadTemplates = () => {
    const mockTemplates: DocumentTemplate[] = [
      {
        id: '1',
        name: 'แบบฟอร์มสมัคร GACP',
        type: 'application_form',
        description: 'แบบฟอร์มมาตรฐานสำหรับการสมัครใบรับรอง GACP',
        template_data: {},
        status: 'active'
      },
      {
        id: '2',
        name: 'แบบประเมินการตรวจสอบในไร่',
        type: 'assessment_form',
        description: 'แบบฟอร์มประเมินสำหรับการตรวจสอบในพื้นที่เพาะปลูก',
        template_data: {},
        status: 'active'
      }
    ];
    setTemplates(mockTemplates);
  };

  const getStatusBadge = (status: SOPDocument['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'ร่าง' },
      active: { variant: 'default' as const, label: 'ใช้งาน' },
      archived: { variant: 'outline' as const, label: 'เก็บถาวร' }
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const filteredSOPs = sopDocuments.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sop.plant_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || sop.category === filterCategory;
    const matchesPlant = filterPlant === 'all' || sop.plant_type === filterPlant;
    
    return matchesSearch && matchesCategory && matchesPlant;
  });

  const createNewSOP = () => {
    const newSOP: SOPDocument = {
      id: Date.now().toString(),
      title: '',
      plant_type: '',
      category: 'general',
      content: '',
      version: '1.0',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'Current User'
    };
    setSelectedDocument(newSOP);
    setShowEditor(true);
  };

  const saveSOP = (sopData: Partial<SOPDocument>) => {
    if (selectedDocument) {
      if (selectedDocument.id && sopDocuments.find(s => s.id === selectedDocument.id)) {
        // Update existing
        setSopDocuments(prev => prev.map(s => 
          s.id === selectedDocument.id 
            ? { ...s, ...sopData, updated_at: new Date().toISOString() }
            : s
        ));
        toast({
          title: "บันทึกสำเร็จ",
          description: "อัพเดทเอกสาร SOP เรียบร้อยแล้ว",
        });
      } else {
        // Create new
        const newSOP = { 
          ...selectedDocument, 
          ...sopData, 
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setSopDocuments(prev => [newSOP, ...prev]);
        toast({
          title: "สร้างสำเร็จ",
          description: "สร้างเอกสาร SOP ใหม่เรียบร้อยแล้ว",
        });
      }
      setShowEditor(false);
      setSelectedDocument(null);
    }
  };

  const deleteSOP = (id: string) => {
    setSopDocuments(prev => prev.filter(s => s.id !== id));
    toast({
      title: "ลบสำเร็จ",
      description: "ลบเอกสาร SOP เรียบร้อยแล้ว",
    });
  };

  const renderSOPList = () => (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการเอกสาร SOP</h2>
          <p className="text-muted-foreground">มาตรฐานการปฏิบัติงานสำหรับพืชสมุนไพรแต่ละชนิด</p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={createNewSOP}>
            <Plus className="mr-2 h-4 w-4" />
            สร้าง SOP ใหม่
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ชื่อเอกสารหรือชนิดพืช"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label>ประเภท</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ชนิดพืช</Label>
              <Select value={filterPlant} onValueChange={setFilterPlant}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกชนิดพืช" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {PLANT_TYPES.map(plant => (
                    <SelectItem key={plant} value={plant}>
                      {plant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดทั้งหมด
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOP List */}
      <div className="grid gap-4">
        {filteredSOPs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบเอกสาร SOP</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterCategory !== 'all' || filterPlant !== 'all'
                  ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา'
                  : 'ยังไม่มีเอกสาร SOP ในระบบ'
                }
              </p>
              {userRole === 'admin' && (
                <Button onClick={createNewSOP}>
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง SOP แรก
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSOPs.map((sop) => (
            <Card key={sop.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{sop.title}</h3>
                      {getStatusBadge(sop.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>ชนิดพืช: {sop.plant_type}</span>
                      <span>ประเภท: {getCategoryLabel(sop.category)}</span>
                      <span>เวอร์ชัน: {sop.version}</span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      อัพเดทล่าสุด: {new Date(sop.updated_at).toLocaleDateString('th-TH')} โดย {sop.created_by}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(sop);
                        setShowEditor(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {userRole === 'admin' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(sop);
                            setShowEditor(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSOP(sop.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderSOPEditor = () => (
    <Dialog open={showEditor} onOpenChange={setShowEditor}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedDocument?.id && sopDocuments.find(s => s.id === selectedDocument.id) 
              ? 'แก้ไขเอกสาร SOP' 
              : 'สร้างเอกสาร SOP ใหม่'
            }
          </DialogTitle>
        </DialogHeader>
        
        {selectedDocument && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">ชื่อเอกสาร</Label>
                <Input
                  id="title"
                  value={selectedDocument.title}
                  onChange={(e) => setSelectedDocument({...selectedDocument, title: e.target.value})}
                  placeholder="ชื่อเอกสาร SOP"
                />
              </div>
              
              <div>
                <Label>ชนิดพืช</Label>
                <Select 
                  value={selectedDocument.plant_type} 
                  onValueChange={(value) => setSelectedDocument({...selectedDocument, plant_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกชนิดพืช" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANT_TYPES.map(plant => (
                      <SelectItem key={plant} value={plant}>
                        {plant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>ประเภท</Label>
                <Select 
                  value={selectedDocument.category} 
                  onValueChange={(value) => setSelectedDocument({...selectedDocument, category: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">เวอร์ชัน</Label>
                <Input
                  id="version"
                  value={selectedDocument.version}
                  onChange={(e) => setSelectedDocument({...selectedDocument, version: e.target.value})}
                  placeholder="1.0"
                />
              </div>

              <div>
                <Label>สถานะ</Label>
                <Select 
                  value={selectedDocument.status} 
                  onValueChange={(value) => setSelectedDocument({...selectedDocument, status: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">ร่าง</SelectItem>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="archived">เก็บถาวร</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">เนื้อหา</Label>
              <Textarea
                id="content"
                value={selectedDocument.content}
                onChange={(e) => setSelectedDocument({...selectedDocument, content: e.target.value})}
                placeholder="เนื้อหาเอกสาร SOP (รองรับ Markdown)"
                rows={15}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => saveSOP(selectedDocument)}>
                บันทึก
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('sop')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sop'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="inline-block mr-2 h-4 w-4" />
          เอกสาร SOP
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Copy className="inline-block mr-2 h-4 w-4" />
          แม่แบบเอกสาร
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="inline-block mr-2 h-4 w-4" />
          คลังเอกสาร
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'sop' && (
        <>
          {renderSOPList()}
          {renderSOPEditor()}
        </>
      )}
      
      {activeTab === 'templates' && (
        <div className="text-center p-8">
          <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">แม่แบบเอกสาร</h3>
          <p className="text-muted-foreground">ฟีเจอร์นี้จะพัฒนาในเฟสถัดไป</p>
        </div>
      )}
      
      {activeTab === 'documents' && (
        <div className="text-center p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">คลังเอกสาร</h3>
          <p className="text-muted-foreground">ฟีเจอร์นี้จะพัฒนาในเฟสถัดไป</p>
        </div>
      )}
    </div>
  );
};