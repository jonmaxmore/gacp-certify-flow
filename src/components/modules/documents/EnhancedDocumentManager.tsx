import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentFile {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_status: 'uploading' | 'uploaded' | 'processing' | 'verified' | 'rejected';
  verification_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  upload_progress: number;
  s3_url?: string;
  thumbnail_url?: string;
  virus_scan_status: 'pending' | 'clean' | 'infected' | 'error';
  reviewer_notes?: string;
  uploaded_at: string;
  verified_at?: string;
}

const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'สำเนาบัตรประชาชน', required: true },
  { value: 'house_registration', label: 'สำเนาทะเบียนบ้าน', required: true },
  { value: 'land_deed', label: 'โฉนดที่ดิน/น.ส.3/ส.ค.1', required: true },
  { value: 'farm_map', label: 'แผนที่ฟาร์ม', required: true },
  { value: 'training_certificate', label: 'ใบรับรองการฝึกอบรม GACP', required: true },
  { value: 'farm_photos', label: 'รูปถ่ายฟาร์ม', required: false },
  { value: 'water_test', label: 'ผลการตรวจน้ำ', required: false },
  { value: 'soil_test', label: 'ผลการตรวจดิน', required: false },
  { value: 'other_certificates', label: 'ใบรับรองอื่นๆ', required: false },
];

interface EnhancedDocumentManagerProps {
  applicationId: string;
  readonly?: boolean;
}

export const EnhancedDocumentManager: React.FC<EnhancedDocumentManagerProps> = ({ 
  applicationId, 
  readonly = false 
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  const loadDocuments = () => {
    // Mock documents - in real app, fetch from API
    const mockDocuments: DocumentFile[] = [
      {
        id: '1',
        application_id: applicationId,
        document_type: 'national_id',
        file_name: 'บัตรประชาชน.pdf',
        file_size: 1024 * 1024 * 2, // 2MB
        mime_type: 'application/pdf',
        upload_status: 'verified',
        verification_status: 'approved',
        upload_progress: 100,
        virus_scan_status: 'clean',
        uploaded_at: '2024-01-15T10:30:00Z',
        verified_at: '2024-01-15T14:20:00Z',
        s3_url: 'https://example.com/file1.pdf'
      },
      {
        id: '2',
        application_id: applicationId,
        document_type: 'training_certificate',
        file_name: 'ใบรับรองการฝึกอบรม.jpg',
        file_size: 1024 * 1024 * 5, // 5MB
        mime_type: 'image/jpeg',
        upload_status: 'uploaded',
        verification_status: 'needs_revision',
        upload_progress: 100,
        virus_scan_status: 'clean',
        reviewer_notes: 'รูปภาพไม่ชัดเจน กรุณาอัพโหลดใหม่ในความละเอียดสูงกว่า',
        uploaded_at: '2024-01-16T09:15:00Z'
      },
      {
        id: '3',
        application_id: applicationId,
        document_type: 'farm_map',
        file_name: 'แผนที่ฟาร์ม.pdf',
        file_size: 1024 * 1024 * 3, // 3MB
        mime_type: 'application/pdf',
        upload_status: 'processing',
        verification_status: 'pending',
        upload_progress: 100,
        virus_scan_status: 'pending',
        uploaded_at: '2024-01-16T11:00:00Z'
      }
    ];
    setDocuments(mockDocuments);
  };

  const handleFileUpload = async (documentType: string, files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "ขนาดไฟล์เกินขีดจำกัด",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "ประเภทไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์ PDF หรือรูปภาพ (JPG, PNG)",
        variant: "destructive"
      });
      return;
    }

    // Create document record
    const newDocument: DocumentFile = {
      id: Date.now().toString(),
      application_id: applicationId,
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      upload_status: 'uploading',
      verification_status: 'pending',
      upload_progress: 0,
      virus_scan_status: 'pending',
      uploaded_at: new Date().toISOString()
    };

    setDocuments(prev => [...prev, newDocument]);

    // Simulate file upload with progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        
        // Update document status after upload
        setTimeout(() => {
          setDocuments(prev => prev.map(doc => 
            doc.id === newDocument.id 
              ? { 
                  ...doc, 
                  upload_status: 'processing',
                  upload_progress: 100,
                  s3_url: `https://example.com/${file.name}`
                }
              : doc
          ));
          
          // Simulate virus scan and processing
          setTimeout(() => {
            setDocuments(prev => prev.map(doc => 
              doc.id === newDocument.id 
                ? { 
                    ...doc, 
                    upload_status: 'uploaded',
                    virus_scan_status: 'clean'
                  }
                : doc
            ));
            
            toast({
              title: "อัพโหลดสำเร็จ",
              description: `ไฟล์ ${file.name} ถูกอัพโหลดเรียบร้อยแล้ว`,
            });
          }, 2000);
        }, 1000);
      }
      
      setDocuments(prev => prev.map(doc => 
        doc.id === newDocument.id 
          ? { ...doc, upload_progress: Math.min(progress, 100) }
          : doc
      ));
    }, 200);
  };

  const deleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    toast({
      title: "ลบเอกสารสำเร็จ",
      description: "เอกสารถูกลบออกจากระบบแล้ว",
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(dt => dt.value === type)?.label || type;
  };

  const getStatusIcon = (document: DocumentFile) => {
    if (document.upload_status === 'uploading') {
      return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
    }
    
    switch (document.verification_status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
      case 'needs_revision':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (document: DocumentFile) => {
    if (document.upload_status === 'uploading') {
      return <Badge variant="secondary">กำลังอัพโหลด</Badge>;
    }
    
    switch (document.verification_status) {
      case 'approved':
        return <Badge variant="default">อนุมัติแล้ว</Badge>;
      case 'rejected':
        return <Badge variant="destructive">ถูกปฏิเสธ</Badge>;
      case 'needs_revision':
        return <Badge variant="outline">ต้องแก้ไข</Badge>;
      case 'pending':
        return <Badge variant="secondary">รอตรวจสอบ</Badge>;
      default:
        return <Badge variant="outline">ไม่ทราบสถานะ</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderDocumentUpload = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">อัพโหลดเอกสารประกอบการสมัคร</h3>
      
      <div className="grid gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = documents.find(d => d.document_type === docType.value);
          
          return (
            <Card key={docType.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{docType.label}</h4>
                      {docType.required && (
                        <Badge variant="outline" className="text-xs">จำเป็น</Badge>
                      )}
                    </div>
                    
                    {existingDoc && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-3">
                          {getFileIcon(existingDoc.mime_type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{existingDoc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(existingDoc.file_size)} • 
                              อัพโหลดเมื่อ {new Date(existingDoc.uploaded_at).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          {getStatusIcon(existingDoc)}
                        </div>
                        
                        {existingDoc.upload_status === 'uploading' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>กำลังอัพโหลด...</span>
                              <span>{Math.round(existingDoc.upload_progress)}%</span>
                            </div>
                            <Progress value={existingDoc.upload_progress} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(existingDoc)}
                          
                          {existingDoc.verification_status === 'needs_revision' && existingDoc.reviewer_notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                              <p className="text-xs text-amber-800">
                                <strong>หมายเหตุจากผู้ตรวจสอบ:</strong> {existingDoc.reviewer_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {existingDoc && (
                      <>
                        {existingDoc.s3_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(existingDoc);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {existingDoc.s3_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(existingDoc.s3_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        {!readonly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(existingDoc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}

                    {!readonly && (
                      <div className="relative">
                        <input
                          type="file"
                          id={`upload-${docType.value}`}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => e.target.files && handleFileUpload(docType.value, e.target.files)}
                        />
                        <Button variant={existingDoc ? "outline" : "default"} size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          {existingDoc ? 'เปลี่ยนไฟล์' : 'อัพโหลด'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDocumentPreview = () => (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {selectedDocument && getDocumentTypeLabel(selectedDocument.document_type)}
          </DialogTitle>
        </DialogHeader>
        
        {selectedDocument && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {getFileIcon(selectedDocument.mime_type)}
              <div>
                <h4 className="font-medium">{selectedDocument.file_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedDocument.file_size)} • {selectedDocument.mime_type}
                </p>
              </div>
            </div>

            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {selectedDocument.mime_type.startsWith('image/') ? (
                <div className="text-center">
                  <Image className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">ตัวอย่างรูปภาพ</p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">ตัวอย่างไฟล์ PDF</p>
                </div>
              )}
            </div>

            {selectedDocument.s3_url && (
              <Button 
                onClick={() => window.open(selectedDocument.s3_url, '_blank')}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลดไฟล์
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {renderDocumentUpload()}
      {renderDocumentPreview()}
    </div>
  );
};