import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Image, Download, Printer, Eye, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  s3_url?: string;
  mime_type?: string;
  file_size?: number;
  verified: boolean;
  reviewer_notes?: string;
  uploaded_at: string;
}

interface DocumentViewerProps {
  documents: Document[];
  onDocumentVerify?: (documentId: string, verified: boolean, notes?: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents, 
  onDocumentVerify 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const getDocumentIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getDocumentTypeLabel = (documentType: string) => {
    const typeMap: { [key: string]: string } = {
      'identity_card': 'บัตรประชาชน',
      'farm_certificate': 'ใบรับรองแปลง',
      'water_certificate': 'ใบรับรองน้ำ',
      'soil_certificate': 'ใบรับรองดิน',
      'production_plan': 'แผนการผลิต',
      'farm_map': 'แผนที่แปลง',
      'other': 'เอกสารอื่นๆ'
    };
    return typeMap[documentType] || documentType;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'ไม่ทราบขนาด';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePrintDocuments = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>เอกสารประกอบใบสมัคร</title>
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .document-section { margin-bottom: 30px; page-break-inside: avoid; }
            .document-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
            .document-info { background: #f5f5f5; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
            .document-image { max-width: 100%; height: auto; border: 1px solid #ddd; margin: 10px 0; }
            .page-break { page-break-before: always; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>เอกสารประกอบใบสมัครรับรอง GACP</h1>
            <p>พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          ${documents.map((doc, index) => `
            <div class="document-section ${index > 0 ? 'page-break' : ''}">
              <div class="document-title">${index + 1}. ${getDocumentTypeLabel(doc.document_type)}</div>
              <div class="document-info">
                <strong>ชื่อไฟล์:</strong> ${doc.file_name}<br>
                <strong>ขนาด:</strong> ${formatFileSize(doc.file_size)}<br>
                <strong>วันที่อัพโหลด:</strong> ${new Date(doc.uploaded_at).toLocaleDateString('th-TH')}<br>
                <strong>สถานะ:</strong> ${doc.verified ? 'ตรวจสอบแล้ว ✓' : 'รอตรวจสอบ'}
                ${doc.reviewer_notes ? `<br><strong>หมายเหตุ:</strong> ${doc.reviewer_notes}` : ''}
              </div>
              ${doc.mime_type?.startsWith('image/') && doc.s3_url ? 
                `<img src="${doc.s3_url}" alt="${doc.file_name}" class="document-image" />` : 
                '<p>ไฟล์เอกสาร (ไม่สามารถแสดงตัวอย่างได้)</p>'
              }
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            เอกสารประกอบ ({documents.length} ไฟล์)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handlePrintDocuments}>
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์เอกสารทั้งหมด
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่มีเอกสารประกอบ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getDocumentIcon(doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{getDocumentTypeLabel(doc.document_type)}</h4>
                        <Badge variant={doc.verified ? 'default' : 'secondary'}>
                          {doc.verified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      ดู
                    </Button>
                    
                    {doc.s3_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.s3_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ดาวน์โหลด
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getDocumentIcon(selectedDocument.mime_type)}
                  {getDocumentTypeLabel(selectedDocument.document_type)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col h-full max-h-[70vh]">
                {/* Controls */}
                <div className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[60px] text-center">{zoom}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(200, zoom + 25))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((rotation + 90) % 360)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedDocument.s3_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedDocument.s3_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ดาวน์โหลด
                      </Button>
                    )}
                  </div>
                </div>

                {/* Document Content */}
                <div className="flex-1 overflow-auto p-4 bg-muted/20">
                  {selectedDocument.mime_type?.startsWith('image/') && selectedDocument.s3_url ? (
                    <div className="flex justify-center">
                      <img
                        src={selectedDocument.s3_url}
                        alt={selectedDocument.file_name}
                        className="max-w-full h-auto transition-all duration-200"
                        style={{
                          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                          transformOrigin: 'center'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">ไม่สามารถแสดงตัวอย่างได้</h3>
                      <p className="text-muted-foreground mb-4">
                        ไฟล์ประเภท {selectedDocument.mime_type || 'ไม่ทราบ'} ไม่รองรับการแสดงตัวอย่าง
                      </p>
                      {selectedDocument.s3_url && (
                        <Button onClick={() => window.open(selectedDocument.s3_url, '_blank')}>
                          เปิดไฟล์ในแท็บใหม่
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Document Info */}
                <div className="p-4 border-t bg-muted/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ชื่อไฟล์:</span>
                      <p className="font-medium truncate">{selectedDocument.file_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ขนาด:</span>
                      <p className="font-medium">{formatFileSize(selectedDocument.file_size)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อัพโหลดเมื่อ:</span>
                      <p className="font-medium">{new Date(selectedDocument.uploaded_at).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">สถานะ:</span>
                      <Badge variant={selectedDocument.verified ? 'default' : 'secondary'} className="mt-1">
                        {selectedDocument.verified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedDocument.reviewer_notes && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">หมายเหตุผู้ตรวจสอบ:</span>
                      <p className="text-sm mt-1">{selectedDocument.reviewer_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};