import * as React from "react"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (files: FileList) => void
  accept?: string
  maxSize?: number // in MB
  multiple?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  id: string
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    onFileSelect, 
    accept = ".pdf,.jpg,.jpeg,.png",
    maxSize = 10, // 10MB default
    multiple = false,
    disabled = false,
    className,
    children,
    ...props 
  }, ref) => {
    const { toast } = useToast()
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])
    const [isDragOver, setIsDragOver] = React.useState(false)

    const validateFile = (file: File): boolean => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "ขนาดไฟล์เกินขีดจำกัด",
          description: `กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน ${maxSize}MB`,
          variant: "destructive"
        })
        return false
      }

      // Check file type
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type

      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type
        }
        return mimeType.startsWith(type.replace('*', ''))
      })

      if (!isValidType) {
        toast({
          title: "ประเภทไฟล์ไม่ถูกต้อง",
          description: `กรุณาเลือกไฟล์ที่รองรับ: ${accept}`,
          variant: "destructive"
        })
        return false
      }

      return true
    }

    const handleFileSelect = (files: FileList | null) => {
      if (!files || disabled) return

      const validFiles = Array.from(files).filter(validateFile)
      if (validFiles.length === 0) return

      // Create uploaded file objects
      const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        progress: 0,
        status: 'uploading' as const,
        id: `${file.name}-${Date.now()}`
      }))

      setUploadedFiles(prev => [...prev, ...newUploadedFiles])

      // Simulate upload progress
      newUploadedFiles.forEach((uploadedFile, index) => {
        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 30
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, progress: 100, status: 'success' }
                  : f
              )
            )
          } else {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === uploadedFile.id 
                  ? { ...f, progress }
                  : f
              )
            )
          }
        }, 100 + index * 50) // Stagger the uploads slightly
      })

      // Call the parent handler
      const fileList = new DataTransfer()
      validFiles.forEach(file => fileList.items.add(file))
      onFileSelect(fileList.files)
    }

    const handleClick = () => {
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files)
      }
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const removeFile = (fileId: string) => {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {/* Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          {children || (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                ลากและวางไฟล์ที่นี่
              </p>
              <p className="text-muted-foreground mb-4">
                หรือคลิกเพื่อเลือกไฟล์
              </p>
              <Button variant="outline" disabled={disabled}>
                เลือกไฟล์จากคอมพิวเตอร์
              </Button>
              <div className="mt-4 text-xs text-muted-foreground">
                รองรับไฟล์: {accept} | ขนาดสูงสุด: {maxSize}MB
              </div>
            </>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">ไฟล์ที่อัพโหลด</h4>
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  
                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'success' && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      สำเร็จ
                    </Badge>
                  )}
                  {uploadedFile.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      ล้มเหลว
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"