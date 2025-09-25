import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Save, Upload, CheckCircle, FileText, MapPin, Users, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SkuInput } from '@/components/ui/sku-input';
import { FileUpload } from '@/components/ui/file-upload';
import { AppleCard } from '@/components/ui/apple-card';

interface ApplicationFormData {
  // Applicant Information
  applicant_name: string;
  applicant_id_number: string;
  applicant_address: string;
  applicant_phone: string;
  applicant_email: string;
  organization_name: string;
  organization_registration: string;
  representative_name: string;
  representative_position: string;
  
  // Farm Information
  farm_name: string;
  farm_address: string;
  farm_coordinates: string;
  farm_area_rai: number;
  farm_area_ngan: number;
  farm_area_wah: number;
  crop_types: string[];
  cultivation_methods: string[];
  expected_yield: string;
  
  // Staff and Training
  responsible_person: string;
  staff_count: number;
  training_completed: boolean;
  training_date: string;
}

const ApplicationWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(id || null);
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicant_name: '',
    applicant_id_number: '',
    applicant_address: '',
    applicant_phone: '',
    applicant_email: '',
    organization_name: '',
    organization_registration: '',
    representative_name: '',
    representative_position: '',
    farm_name: '',
    farm_address: '',
    farm_coordinates: '',
    farm_area_rai: 0,
    farm_area_ngan: 0,
    farm_area_wah: 0,
    crop_types: [],
    cultivation_methods: [],
    expected_yield: '',
    responsible_person: '',
    staff_count: 0,
    training_completed: false,
    training_date: '',
  });

  const steps = [
    { 
      id: 1, 
      title: 'ข้อมูลผู้สมัคร', 
      description: 'ข้อมูลพื้นฐานของผู้สมัครและองค์กร',
      icon: FileText
    },
    { 
      id: 2, 
      title: 'ข้อมูลฟาร์ม', 
      description: 'รายละเอียดพื้นที่เพาะปลูกและวิธีการเพาะปลูก',
      icon: MapPin
    },
    { 
      id: 3, 
      title: 'บุคลากรและการฝึกอบรม', 
      description: 'ข้อมูลผู้รับผิดชอบและการฝึกอบรม',
      icon: Users
    },
    { 
      id: 4, 
      title: 'อัพโหลดเอกสาร', 
      description: 'แนบเอกสารประกอบการสมัคร',
      icon: Upload
    },
    { 
      id: 5, 
      title: 'ตรวจสอบและส่ง', 
      description: 'ตรวจสอบข้อมูลและส่งใบสมัคร',
      icon: CheckCircle
    },
  ];

  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const cropOptions = [
    'ข้าว', 'ข้าวโพด', 'อ้อย', 'มันสำปะหลัง', 'ถั่วเหลือง', 'ผักใบเขียว', 'ผลไม้', 'พืชสมุนไพร', 'อื่นๆ'
  ];

  const cultivationMethods = [
    'เกษตรอินทรีย์', 'เกษตรแปลงใหญ่', 'เกษตรผสมผสาน', 'เกษตรธรรมชาติ', 'การเกษตรแม่นยำ', 'อื่นๆ'
  ];

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    } else {
      // Pre-fill with user data
      setFormData(prev => ({
        ...prev,
        applicant_name: user?.profile?.full_name || '',
        applicant_email: user?.profile?.email || '',
        applicant_phone: user?.profile?.phone || '',
        organization_name: user?.profile?.organization_name || '',
      }));
    }
  }, [applicationId, user]);

  const loadApplication = async () => {
    if (!applicationId) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          applicant_name: data.applicant_name || '',
          applicant_id_number: data.applicant_id_number || '',
          applicant_address: data.applicant_address || '',
          applicant_phone: data.applicant_phone || '',
          applicant_email: data.applicant_email || '',
          organization_name: data.organization_name || '',
          organization_registration: data.organization_registration || '',
          representative_name: data.representative_name || '',
          representative_position: data.representative_position || '',
          farm_name: data.farm_name || '',
          farm_address: data.farm_address || '',
          farm_coordinates: data.farm_coordinates || '',
          farm_area_rai: data.farm_area_rai || 0,
          farm_area_ngan: data.farm_area_ngan || 0,
          farm_area_wah: data.farm_area_wah || 0,
          crop_types: data.crop_types || [],
          cultivation_methods: data.cultivation_methods || [],
          expected_yield: data.expected_yield || '',
          responsible_person: data.responsible_person || '',
          staff_count: data.staff_count || 0,
          training_completed: data.training_completed || false,
          training_date: data.training_date || '',
        });
      }
    } catch (error) {
      console.error('Error loading application:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (isDraft = true) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Prepare application data with proper date handling
      const applicationData = {
        applicant_id: user.id,
        status: isDraft ? 'DRAFT' as const : 'SUBMITTED' as const,
        ...formData,
        // Handle date fields properly - convert empty strings to null
        training_date: formData.training_date || null,
      };

      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from('applications')
          .update(applicationData)
          .eq('id', applicationId);
        
        if (error) throw error;
        
        toast({
          title: "บันทึกสำเร็จ",
          description: isDraft ? "บันทึกข้อมูลเป็นแบบร่างแล้ว" : "ส่งใบสมัครเรียบร้อยแล้ว",
        });
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('applications')
          .insert([applicationData])
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setApplicationId(data.id);
          // Update URL to include the new application ID
          navigate(`/applicant/application/${data.id}/edit`, { replace: true });
        }
        
        toast({
          title: "สร้างใบสมัครสำเร็จ",
          description: isDraft ? "สร้างใบสมัครเป็นแบบร่างแล้ว" : "ส่งใบสมัครเรียบร้อยแล้ว",
        });
      }

      console.log('Application saved successfully');
    } catch (error) {
      console.error('Error saving application:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      handleSave(true); // Auto-save as draft
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await handleSave(false); // Save as submitted
      toast({
        title: "ส่งใบสมัครสำเร็จ!",
        description: "ใบสมัครของคุณได้รับการส่งเรียบร้อยแล้ว เจ้าหน้าที่จะตรวจสอบและติดต่อกลับ",
      });
      navigate('/applicant/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการส่งใบสมัคร",
        description: error?.message || "ไม่สามารถส่งใบสมัครได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">ข้อมูลผู้สมัคร</h3>
              <p className="text-gray-600">กรุณากรอกข้อมูลพื้นฐานของผู้สมัครและองค์กร</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="form-section">
                <CardHeader>
                  <CardTitle className="text-lg">ข้อมูลส่วนบุคคล</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="applicant_name">ชื่อ-นามสกุล *</Label>
                    <Input
                      id="applicant_name"
                      value={formData.applicant_name}
                      onChange={(e) => updateFormData('applicant_name', e.target.value)}
                      placeholder="กรอกชื่อ-นามสกุล"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="applicant_id_number">เลขบัตรประชาชน *</Label>
                    <Input
                      id="applicant_id_number"
                      value={formData.applicant_id_number}
                      onChange={(e) => updateFormData('applicant_id_number', e.target.value)}
                      placeholder="x-xxxx-xxxxx-xx-x"
                      maxLength={17}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="applicant_address">ที่อยู่ *</Label>
                    <Input
                      id="applicant_address"
                      value={formData.applicant_address}
                      onChange={(e) => updateFormData('applicant_address', e.target.value)}
                      placeholder="ที่อยู่ตามบัตรประชาชน"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="applicant_phone">หมายเลขโทรศัพท์ *</Label>
                      <Input
                        id="applicant_phone"
                        value={formData.applicant_phone}
                        onChange={(e) => updateFormData('applicant_phone', e.target.value)}
                        placeholder="08x-xxx-xxxx"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicant_email">อีเมล *</Label>
                      <Input
                        id="applicant_email"
                        type="email"
                        value={formData.applicant_email}
                        onChange={(e) => updateFormData('applicant_email', e.target.value)}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Information */}
              <Card className="form-section">
                <CardHeader>
                  <CardTitle className="text-lg">ข้อมูลองค์กร (ถ้ามี)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="organization_name">ชื่อองค์กร/บริษัท</Label>
                    <Input
                      id="organization_name"
                      value={formData.organization_name}
                      onChange={(e) => updateFormData('organization_name', e.target.value)}
                      placeholder="ชื่อองค์กรหรือบริษัท"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organization_registration">เลขทะเบียนนิติบุคคล</Label>
                    <Input
                      id="organization_registration"
                      value={formData.organization_registration}
                      onChange={(e) => updateFormData('organization_registration', e.target.value)}
                      placeholder="เลขทะเบียนองค์กร"
                    />
                  </div>

                  <div>
                    <Label htmlFor="representative_name">ชื่อผู้แทนองค์กร</Label>
                    <Input
                      id="representative_name"
                      value={formData.representative_name}
                      onChange={(e) => updateFormData('representative_name', e.target.value)}
                      placeholder="ชื่อผู้แทนองค์กร"
                    />
                  </div>

                  <div>
                    <Label htmlFor="representative_position">ตำแหน่งผู้แทนองค์กร</Label>
                    <Input
                      id="representative_position"
                      value={formData.representative_position}
                      onChange={(e) => updateFormData('representative_position', e.target.value)}
                      placeholder="ตำแหน่งในองค์กร"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">ข้อมูลฟาร์ม/พื้นที่เพาะปลูก</h3>
              <p className="text-gray-600">ระบุรายละเอียดเกี่ยวกับพื้นที่เพาะปลูกและวิธีการเพาะปลูก</p>
            </div>

            <Card className="form-section">
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลทั่วไป</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="farm_name">ชื่อฟาร์ม/สวน *</Label>
                    <Input
                      id="farm_name"
                      value={formData.farm_name}
                      onChange={(e) => updateFormData('farm_name', e.target.value)}
                      placeholder="ชื่อฟาร์มหรือสวน"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="farm_coordinates">พิกัด GPS</Label>
                    <Input
                      id="farm_coordinates"
                      value={formData.farm_coordinates}
                      onChange={(e) => updateFormData('farm_coordinates', e.target.value)}
                      placeholder="ละติจูด, ลองจิจูด"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="farm_address">ที่ตั้งฟาร์ม/สวน *</Label>
                  <Input
                    id="farm_address"
                    value={formData.farm_address}
                    onChange={(e) => updateFormData('farm_address', e.target.value)}
                    placeholder="ที่อยู่ของฟาร์มหรือสวน"
                    required
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">ขนาดพื้นที่ *</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="farm_area_rai" className="text-sm">ไร่</Label>
                      <Input
                        id="farm_area_rai"
                        type="number"
                        value={formData.farm_area_rai}
                        onChange={(e) => updateFormData('farm_area_rai', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="farm_area_ngan" className="text-sm">งาน</Label>
                      <Input
                        id="farm_area_ngan"
                        type="number"
                        value={formData.farm_area_ngan}
                        onChange={(e) => updateFormData('farm_area_ngan', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="farm_area_wah" className="text-sm">ตารางวา</Label>
                      <Input
                        id="farm_area_wah"
                        type="number"
                        value={formData.farm_area_wah}
                        onChange={(e) => updateFormData('farm_area_wah', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="form-section">
              <CardHeader>
                <CardTitle className="text-lg">การเพาะปลูก</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">ชนิดพืชที่เพาะปลูก *</Label>
                  <div className="mt-2">
                    <AppleCard variant="default" size="sm" className="bg-primary/5 border-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <span className="text-sm font-medium text-primary">🌿</span>
                        </div>
                        <div>
                          <p className="font-medium text-primary">กัญชา</p>
                          <p className="text-xs text-muted-foreground">พืชเดียวที่อนุญาตให้เพาะปลูกในระบบ GACP</p>
                        </div>
                      </div>
                    </AppleCard>
                  </div>
                </div>

                {/* SKU Input Section */}
                <div>
                  <Label className="text-base font-medium">รายการผลิตภัณฑ์ (SKU)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    เพิ่มรายการผลิตภัณฑ์ที่คุณต้องการผลิต (ไม่จำเป็นต้องกรอกตอนนี้)
                  </p>
                  <SkuInput
                    value={[]}
                    onChange={() => {}}
                    placeholder="เช่น กัญชาแห้ง, น้ำมันกัญชา"
                    maxItems={20}
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">วิธีการเพาะปลูก *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {cultivationMethods.map((method) => (
                      <label key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.cultivation_methods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFormData('cultivation_methods', [...formData.cultivation_methods, method]);
                            } else {
                              updateFormData('cultivation_methods', formData.cultivation_methods.filter(m => m !== method));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expected_yield">ปริมาณผลผลิตโดยประมาณ (ต่อปี)</Label>
                  <Input
                    id="expected_yield"
                    value={formData.expected_yield}
                    onChange={(e) => updateFormData('expected_yield', e.target.value)}
                    placeholder="เช่น 1,000 กิโลกรัม, 50 ตัน"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">บุคลากรและการฝึกอบรม</h3>
              <p className="text-gray-600">ข้อมูลผู้รับผิดชอบและการฝึกอบรมด้านมาตรฐาน GACP</p>
            </div>

            <Card className="form-section">
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลบุคลากร</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsible_person">ผู้รับผิดชอบหลัก *</Label>
                    <Input
                      id="responsible_person"
                      value={formData.responsible_person}
                      onChange={(e) => updateFormData('responsible_person', e.target.value)}
                      placeholder="ชื่อผู้รับผิดชอบ"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="staff_count">จำนวนพนักงาน/แรงงาน</Label>
                    <Input
                      id="staff_count"
                      type="number"
                      value={formData.staff_count}
                      onChange={(e) => updateFormData('staff_count', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="form-section">
              <CardHeader>
                <CardTitle className="text-lg">การฝึกอบรมมาตรฐาน GACP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="training_completed"
                    checked={formData.training_completed}
                    onChange={(e) => updateFormData('training_completed', e.target.checked)}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor="training_completed">
                    ได้รับการฝึกอบรมมาตรฐาน GACP แล้ว
                  </Label>
                </div>

                {formData.training_completed && (
                  <div>
                    <Label htmlFor="training_date">วันที่ผ่านการฝึกอบรม</Label>
                    <Input
                      id="training_date"
                      type="date"
                      value={formData.training_date}
                      onChange={(e) => updateFormData('training_date', e.target.value)}
                    />
                  </div>
                )}

                {!formData.training_completed && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm">
                      <strong>หมายเหตุ:</strong> หากยังไม่ได้รับการฝึกอบรม จะต้องเข้าร่วมการฝึกอบรมก่อนการประเมินออนไซต์
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">อัพโหลดเอกสาร</h3>
              <p className="text-gray-600">แนบเอกสารที่จำเป็นสำหรับการสมัครรับรอง</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required Documents */}
              <Card className="form-section">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">เอกสารบังคับ *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'แบบฟอร์ม กทล.1', type: 'GTL1_FORM', desc: 'แบบฟอร์มการสมัครรับรอง' },
                    { name: 'ใบรับรอง COA', type: 'COA_CERTIFICATE', desc: 'Certificate of Analysis' },
                    { name: 'สำเนาบัตรประชาชน', type: 'ID_CARD', desc: 'สำเนาบัตรประชาชนผู้สมัคร' },
                    { name: 'แผนที่ฟาร์ม', type: 'FARM_MAP', desc: 'แผนผังและแผนที่ตั้งฟาร์ม' },
                  ].map((doc) => (
                    <div key={doc.type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">{doc.desc}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          เลือกไฟล์
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        รองรับไฟล์: PDF, JPG, PNG (สูงสุด 10MB)
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Optional Documents */}
              <Card className="form-section">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">เอกสารเพิ่มเติม</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'ใบอนุญาตประกอบธุรกิจ', type: 'BUSINESS_LICENSE', desc: 'ใบอนุญาตที่เกี่ยวข้อง' },
                    { name: 'รายชื่อพนักงาน', type: 'STAFF_LIST', desc: 'รายชื่อและหน้าที่พนักงาน' },
                    { name: 'เอกสารการฝึกอบรม', type: 'TRAINING_RECORDS', desc: 'ใบรับรองการฝึกอบรม' },
                    { name: 'รูปภาพฟาร์ม', type: 'PHOTOS', desc: 'รูปภาพพื้นที่เพาะปลูก' },
                    { name: 'SOP ของฟาร์ม', type: 'SOP_DOCUMENTS', desc: 'ขั้นตอนการทำงานมาตรฐาน' },
                  ].map((doc) => (
                    <AppleCard key={doc.type} variant="default" size="sm" className="hover:shadow-medium transition-all duration-300">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-foreground">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground">{doc.desc}</p>
                        </div>
                        <FileUpload
                          onFileSelect={(files) => {
                            console.log(`Selected optional files for ${doc.type}:`, files);
                            // Handle optional file upload logic here
                          }}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          maxSize={10}
                        />
                      </div>
                    </AppleCard>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Additional Upload Area */}
            <AppleCard variant="default" size="lg">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">อัพโหลดเอกสารเพิ่มเติม</h3>
                  <p className="text-sm text-muted-foreground">
                    หากมีเอกสารอื่นๆ ที่ต้องการแนบเพิ่มเติม
                  </p>
                </div>
                <FileUpload
                  onFileSelect={(files) => {
                    console.log('Additional files selected:', files);
                    // Handle additional file upload logic here
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  maxSize={10}
                  multiple={true}
                />
              </div>
            </AppleCard>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">ตรวจสอบและส่งใบสมัคร</h3>
              <p className="text-gray-600">กรุณาตรวจสอบข้อมูลทั้งหมดก่อนส่งใบสมัคร</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Application Summary */}
              <div className="space-y-6">
                <Card className="form-section">
                  <CardHeader>
                    <CardTitle className="text-lg">สรุปข้อมูลผู้สมัคร</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อ-นามสกุล:</span>
                      <span className="font-medium">{formData.applicant_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">อีเมล:</span>
                      <span>{formData.applicant_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">โทรศัพท์:</span>
                      <span>{formData.applicant_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">องค์กร:</span>
                      <span>{formData.organization_name || 'ไม่ระบุ'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="form-section">
                  <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลฟาร์ม</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชื่อฟาร์ม:</span>
                      <span className="font-medium">{formData.farm_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ขนาดพื้นที่:</span>
                      <span>{formData.farm_area_rai} ไร่ {formData.farm_area_ngan} งาน {formData.farm_area_wah} วา</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชนิดพืช:</span>
                      <span>{formData.crop_types.join(', ') || 'ไม่ระบุ'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Structure */}
              <div className="space-y-6">
                <Card className="form-section">
                  <CardHeader>
                    <CardTitle className="text-lg">ค่าธรรมเนียม</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">ค่าตรวจสอบเอกสาร</p>
                        <p className="text-sm text-blue-700">การตรวจสอบเอกสารเบื้องต้น</p>
                      </div>
                      <span className="text-lg font-bold text-blue-900">5,000 บาท</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-900">ค่าประเมินออนไซต์</p>
                        <p className="text-sm text-green-700">การตรวจประเมินที่ฟาร์ม</p>
                      </div>
                      <span className="text-lg font-bold text-green-900">25,000 บาท</span>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">รวมทั้งสิ้น</span>
                        <span className="text-2xl font-bold text-primary">30,000 บาท</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="form-section">
                  <CardHeader>
                    <CardTitle className="text-lg">ขั้นตอนถัดไป</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">1</span>
                        <span>ส่งใบสมัครและรับหมายเลขใบสมัคร</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">2</span>
                        <span>ชำระค่าตรวจสอบเอกสาร 5,000 บาท</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">3</span>
                        <span>เจ้าหน้าที่ตรวจสอบเอกสาร (3-5 วันทำการ)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">4</span>
                        <span>ชำระค่าประเมินออนไซต์ 25,000 บาท</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">5</span>
                        <span>นัดหมายและประเมินที่ฟาร์ม</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">6</span>
                        <span>รับใบรับรองมาตรฐาน GACP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Terms and Conditions */}
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="text-lg">คำรับรองและข้อตกลง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" required />
                    <span className="text-sm">
                      ข้าพเจ้าขอรับรองว่าข้อมูลทั้งหมดที่ได้กรอกในใบสมัครนี้เป็นความจริงและถูกต้อง
                    </span>
                  </label>
                  <label className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" required />
                    <span className="text-sm">
                      ข้าพเจ้ายอมรับและจะปฏิบัติตามเงื่อนไขและข้อกำหนดของมาตรฐาน GACP
                    </span>
                  </label>
                  <label className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" required />
                    <span className="text-sm">
                      ข้าพเจ้าอนุญาตให้เจ้าหน้าที่เข้าตรวจสอบพื้นที่เพาะปลูกตามที่นัดหมาย
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/applicant/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {applicationId ? 'แก้ไขใบสมัคร' : 'สร้างใบสมัครใหม่'}
                </h1>
                <p className="text-sm text-gray-600">
                  ขั้นตอนที่ {currentStep} จาก {totalSteps}: {steps[currentStep - 1]?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Progress value={progress} className="w-full mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center text-center flex-1">
                  <div className={`progress-step ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'} mb-2`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-gray-600 max-w-20">
                    {step.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ย้อนกลับ</span>
          </Button>

          <div className="flex items-center space-x-3">
            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งใบสมัคร'}</span>
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>ถัดไป</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export { ApplicationWizard };
export default ApplicationWizard;