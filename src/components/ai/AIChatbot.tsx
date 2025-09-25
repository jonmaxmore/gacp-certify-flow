import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  FileText,
  CreditCard,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actionButtons?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
  status?: 'sent' | 'delivered' | 'read';
}

interface AIChatbotProps {
  userRole: 'applicant' | 'reviewer' | 'auditor' | 'admin';
  context?: {
    currentStep?: string;
    applicationId?: string;
    rejectionCount?: number;
    paymentStatus?: string;
  };
  onAction?: (action: string, data?: any) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  userRole, 
  context,
  onAction 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Role-specific welcome messages
  const getWelcomeMessage = (): ChatMessage => {
    const welcomeMessages = {
      applicant: {
        content: "👋 สวัสดีครับ! ผมเป็น AI Assistant ที่จะช่วยแนะนำคุณตลอดกระบวนการขอรับรองมาตรฐาน GACP \n\nผมสามารถช่วยเหลือในเรื่อง:\n• อธิบายขั้นตอนการสมัคร\n• แนะนำเอกสารที่ต้องเตรียม\n• ตอบคำถามเกี่ยวกับการชำระเงิน\n• ติดตามสถานะใบสมัคร\n\nมีอะไรให้ผมช่วยไหมครับ?",
        actionButtons: [
          { label: "เอกสารที่ต้องเตรียม", action: "show_documents", variant: "outline" as const },
          { label: "ขั้นตอนการสมัคร", action: "show_steps", variant: "outline" as const },
          { label: "สถานะใบสมัคร", action: "check_status", variant: "default" as const }
        ]
      },
      reviewer: {
        content: "👋 สวัสดีครับ! ผมเป็น AI Assistant สำหรับเจ้าหน้าที่ตรวจสอบเอกสาร\n\nผมสามารถช่วยเหลือในเรื่อง:\n• เกณฑ์การตรวจสอบเอกสาร\n• รายการเอกสารที่ครบถ้วน\n• แนวทางการอนุมัติ/ปฏิเสธ\n• การแจ้งเตือนผู้สมัคร\n\nต้องการความช่วยเหลือในเรื่องใดครับ?",
        actionButtons: [
          { label: "เกณฑ์การตรวจสอบ", action: "review_criteria", variant: "outline" as const },
          { label: "คิวรอตรวจสอบ", action: "review_queue", variant: "default" as const }
        ]
      },
      auditor: {
        content: "👋 สวัสดีครับ! ผมเป็น AI Assistant สำหรับเจ้าหน้าที่ประเมิน\n\nผมสามารถช่วยเหลือในเรื่อง:\n• การจัดตารางประเมิน\n• เกณฑ์การประเมิน\n• การบันทึกผลการประเมิน\n• แนวทางการประเมินออนไลน์/ออนไซต์\n\nต้องการความช่วยเหลือในเรื่องใดครับ?",
        actionButtons: [
          { label: "ตารางประเมิน", action: "assessment_schedule", variant: "default" as const },
          { label: "เกณฑ์การประเมิน", action: "assessment_criteria", variant: "outline" as const }
        ]
      },
      admin: {
        content: "👋 สวัสดีครับ! ผมเป็น AI Assistant สำหรับผู้ดูแลระบบ\n\nผมสามารถช่วยเหลือในเรื่อง:\n• การจัดการผู้ใช้งาน\n• รายงานระบบ\n• การสำรองข้อมูล\n• การตรวจสอบความปลอดภัย\n• การจัดการเนื้อหาเว็บไซต์\n\nต้องการความช่วยเหลือในเรื่องใดครับ?",
        actionButtons: [
          { label: "สถานะระบบ", action: "system_status", variant: "default" as const },
          { label: "จัดการผู้ใช้", action: "user_management", variant: "outline" as const },
          { label: "รายงาน", action: "generate_report", variant: "outline" as const }
        ]
      }
    };

    return {
      id: Date.now().toString(),
      type: 'bot',
      content: welcomeMessages[userRole].content,
      timestamp: new Date(),
      actionButtons: welcomeMessages[userRole].actionButtons
    };
  };

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [isOpen, userRole]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Context-aware responses
  const getContextualResponse = (userInput: string): ChatMessage => {
    const input = userInput.toLowerCase();
    
    // Applicant-specific responses
    if (userRole === 'applicant') {
      if (input.includes('เอกสาร') || input.includes('document')) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "📋 เอกสารที่ต้องเตรียมสำหรับการขอรับรอง GACP:\n\n✅ เอกสารหลัก:\n• ใบขึ้นทะเบียนเกษตรกร\n• แผนผังแปลงเกษตร\n• บันทึกการใช้สารเคมี\n• ใบรับรองคุณภาพน้ำ\n\n✅ เอกสารเสริม:\n• รูปถ่ายแปลงเกษตร\n• บันทึกการเก็บเกี่ยว\n• ใบรับรองการฝึกอบรม\n\nต้องการรายละเอียดเพิ่มเติมหรือไม่ครับ?",
          timestamp: new Date(),
          actionButtons: [
            { label: "ดาวน์โหลดรายการเอกสาร", action: "download_checklist", variant: "default" as const },
            { label: "อัปโหลดเอกสาร", action: "upload_documents", variant: "outline" as const }
          ]
        };
      }
      
      if (input.includes('ชำระ') || input.includes('เงิน') || input.includes('payment')) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "💳 ข้อมูลการชำระเงิน:\n\n🔸 ค่าธรรมเนียมการตรวจสอบเอกสาร: 5,000 บาท\n🔸 ค่าธรรมเนียมการประเมิน: 25,000 บาท\n\n📌 วิธีการชำระ:\n• QR Code (PromptPay)\n• โอนผ่านธนาคาร\n• บัตรเครดิต/เดบิต\n\nสถานะการชำระเงินปัจจุบัน: " + (context?.paymentStatus || 'รอการชำระ'),
          timestamp: new Date(),
          actionButtons: context?.paymentStatus !== 'completed' ? [
            { label: "ชำระเงินตอนนี้", action: "make_payment", variant: "default" as const }
          ] : []
        };
      }
    }

    // Reviewer-specific responses
    if (userRole === 'reviewer') {
      if (input.includes('อนุมัติ') || input.includes('approve')) {
        return {
          id: Date.now().toString(),
          type: 'bot',
          content: "✅ เกณฑ์การอนุมัติเอกสาร:\n\n🔍 ตรวจสอบความครบถ้วน:\n• เอกสารครบตามรายการ\n• ข้อมูลถูกต้องชัดเจน\n• มีลายเซ็นและวันที่\n\n🔍 ตรวจสอบคุณภาพ:\n• รูปภาพชัดเจน\n• ข้อมูลตรงกับแบบฟอร์ม\n• ไม่มีการปลอมแปลง\n\n📝 หากไม่ผ่าน สามารถปฏิเสธพร้อมระบุเหตุผล",
          timestamp: new Date(),
          actionButtons: [
            { label: "ดูคิวรอตรวจ", action: "review_queue", variant: "default" as const }
          ]
        };
      }
    }

    // Generic helpful response
    return {
      id: Date.now().toString(),
      type: 'bot',
      content: "🤔 ขออภัยครับ ผมไม่เข้าใจคำถามของคุณ\n\nคุณสามารถถามเกี่ยวกับ:\n• ขั้นตอนการดำเนินงาน\n• เอกสารที่ต้องใช้\n• สถานะการสมัคร\n• การชำระเงิน\n\nหรือใช้ปุ่มด่วนด้านล่างเพื่อเลือกหัวข้อที่สนใจครับ",
      timestamp: new Date(),
      actionButtons: [
        { label: "ช่วยเหลือทั่วไป", action: "general_help", variant: "outline" as const },
        { label: "ติดต่อเจ้าหน้าที่", action: "contact_support", variant: "outline" as const }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = getContextualResponse(inputValue);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleActionClick = (action: string) => {
    if (onAction) {
      onAction(action);
    }
    
    // Add contextual response based on action
    const actionResponses: Record<string, string> = {
      'show_documents': '📋 แสดงรายการเอกสารแล้วครับ ตรวจสอบรายละเอียดด้านบนได้เลยครับ',
      'show_steps': '📝 แสดงขั้นตอนการสมัครแล้วครับ คุณสามารถติดตามความคืบหน้าได้จากแดชบอร์ด',
      'check_status': '🔍 กำลังตรวจสอบสถานะใบสมัครของคุณ...',
      'make_payment': '💳 เปิดหน้าชำระเงินแล้วครับ กรุณาเลือกวิธีการชำระที่สะดวก',
      'upload_documents': '📤 เปิดหน้าอัปโหลดเอกสารแล้วครับ'
    };

    if (actionResponses[action]) {
      const responseMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: actionResponses[action],
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, responseMessage]);
      }, 500);
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'applicant': return '🧑‍🌾';
      case 'reviewer': return '📝';
      case 'auditor': return '🕵️';
      case 'admin': return '⚙️';
      default: return '🤖';
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'applicant': return 'AI ผู้ช่วยเกษตรกร';
      case 'reviewer': return 'AI ผู้ช่วยตรวจสอบ';
      case 'auditor': return 'AI ผู้ช่วยประเมิน';
      case 'admin': return 'AI ผู้ช่วยแอดมิน';
      default: return 'AI Assistant';
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        {/* Notification badge for new features */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      </div>
    );
  }

  // Chat window
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
    }`}>
      <Card className="h-full flex flex-col shadow-2xl border-0 bg-white">
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">{getRoleIcon()}</span>
            </div>
            <div>
              <CardTitle className="text-lg font-medium">{getRoleTitle()}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                ออนไลน์
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 w-8 h-8 p-0"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 w-8 h-8 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === 'bot' && (
                          <Bot className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-line leading-relaxed">
                            {message.content}
                          </p>
                          
                          {/* Action buttons */}
                          {message.actionButtons && message.actionButtons.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.actionButtons.map((button, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant={button.variant || 'outline'}
                                  className="text-xs h-7"
                                  onClick={() => handleActionClick(button.action)}
                                >
                                  {button.label}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-60">
                              {message.timestamp.toLocaleTimeString('th-TH', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.type === 'user' && message.status && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-500" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="พิมพ์ข้อความ..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => handleActionClick('general_help')}
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  ช่วยเหลือ
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => handleActionClick('quick_tips')}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  เคล็ดลับ
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AIChatbot;