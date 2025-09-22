import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Award, 
  FileText,
  Video,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'gacp_basics' | 'cultivation' | 'documentation' | 'quality_control' | 'regulations';
}

interface TestResult {
  id: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  completedAt: string;
  answers: { [questionId: string]: number };
  passed: boolean;
}

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;
  videoUrl: string;
  transcriptUrl?: string;
  watched: boolean;
}

const KNOWLEDGE_TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 'q1',
    question: 'GACP ย่อมาจากอะไร?',
    options: [
      'Good Agricultural and Collection Practices',
      'General Agriculture Control Process',
      'Global Agricultural Certification Program',
      'Green Agriculture Community Project'
    ],
    correctAnswer: 0,
    explanation: 'GACP ย่อมาจาก Good Agricultural and Collection Practices หรือแนวทางการปฏิบัติทางการเกษตรและเก็บเกี่ยวที่ดี',
    difficulty: 'easy',
    category: 'gacp_basics'
  },
  {
    id: 'q2',
    question: 'วัตถุประสงค์หลักของมาตรฐาน GACP คืออะไร?',
    options: [
      'เพื่อเพิ่มผลผลิตให้มากที่สุด',
      'เพื่อส่งเสริมความรู้และพัฒนาระบบการปลูกและเก็บเกี่ยวให้ได้มาตรฐาน',
      'เพื่อลดต้นทุนการผลิต',
      'เพื่อส่งออกสินค้าเกษตร'
    ],
    correctAnswer: 1,
    explanation: 'วัตถุประสงค์หลักของ GACP คือการส่งเสริมความรู้และพัฒนาระบบการปลูกและเก็บเกี่ยวของพืชสมุนไพรให้ได้มาตรฐานระดับสากล',
    difficulty: 'medium',
    category: 'gacp_basics'
  },
  {
    id: 'q3',
    question: 'การเตรียมดินสำหรับการปลูกพืชสมุนไพรตาม GACP ควรคำนึงถึงอะไรเป็นหลัก?',
    options: [
      'ราคาดินที่ถูกที่สุด',
      'ความอุดมสมบูรณ์และการระบายน้ำที่ดี',
      'ความใกล้กับแหล่งน้ำเท่านั้น',
      'ความสวยงามของพื้นที่'
    ],
    correctAnswer: 1,
    explanation: 'การเตรียมดินควรคำนึงถึงความอุดมสมบูรณ์ของดิน การระบายน้ำที่ดี และความปลอดภัยจากการปนเปื้อน',
    difficulty: 'medium',
    category: 'cultivation'
  },
  {
    id: 'q4',
    question: 'เอกสารใดที่จำเป็นต้องมีในการขอใบรับรอง GACP?',
    options: [
      'ใบรับรองการฝึกอบรม GACP',
      'แผนที่ฟาร์ม',
      'โฉนดที่ดิน/น.ส.3',
      'ถูกทุกข้อ'
    ],
    correctAnswer: 3,
    explanation: 'การขอใบรับรอง GACP ต้องมีเอกสารครบถ้วน ได้แก่ ใบรับรองการฝึกอบรม แผนที่ฟาร์ม เอกสารสิทธิ์ในที่ดิน และเอกสารอื่นๆ ตามที่กำหนด',
    difficulty: 'medium',
    category: 'documentation'
  },
  {
    id: 'q5',
    question: 'การควบคุมคุณภาพหลังการเก็บเกี่ยวควรคำนึงถึงอะไรบ้าง?',
    options: [
      'การล้างทำความสะอาดด้วยน้ำสะอาด',
      'การแยกผลิตผลที่เสียหายออก',
      'การควบคุมอุณหภูมิและความชื้น',
      'ถูกทุกข้อ'
    ],
    correctAnswer: 3,
    explanation: 'การควบคุมคุณภาพหลังเก็บเกี่ยวต้องครอบคลุมการล้างทำความสะอาด การคัดแยกผลิตผลที่ดี และการควบคุมสภาพแวดล้อมในการเก็บรักษา',
    difficulty: 'medium',
    category: 'quality_control'
  },
  {
    id: 'q6',
    question: 'ระยะเวลาที่เหมาะสมในการเก็บเกี่ยวพืชสมุนไพรคือช่วงไหน?',
    options: [
      'ช่วงเที่ยงวัน เวลา 12:00-14:00 น.',
      'ช่วงเย็น เวลา 16:00-18:00 น.',
      'ช่วงเช้า เวลา 6:00-10:00 น.',
      'ช่วงกลางคืน เวลา 22:00-02:00 น.'
    ],
    correctAnswer: 2,
    explanation: 'ช่วงเช้าเป็นเวลาที่เหมาะสมที่สุดในการเก็บเกี่ยว เนื่องจากอุณหภูมิไม่สูงมาก และพืชยังมีความสดใหม่',
    difficulty: 'easy',
    category: 'cultivation'
  },
  {
    id: 'q7',
    question: 'การใช้สารเคมีในการปลูกพืชสมุนไพรตาม GACP ควรปฏิบัติอย่างไร?',
    options: [
      'ใช้ได้ทุกชนิดตามความต้องการ',
      'หลีกเลี่ยงการใช้สารเคมีที่เป็นอันตรายต่อสิ่งแวดล้อม',
      'ใช้เฉพาะสารเคมีราคาถูก',
      'ไม่ใช้สารเคมีเลย'
    ],
    correctAnswer: 1,
    explanation: 'ควรหลีกเลี่ยงการใช้สารเคมีที่เป็นอันตรายต่อสิ่งแวดล้อมและสุขภาพ และใช้เฉพาะสารที่ปลอดภัยและได้รับอนุญาต',
    difficulty: 'medium',
    category: 'regulations'
  },
  {
    id: 'q8',
    question: 'pH ของดินที่เหมาะสมสำหรับการปลูกพืชสมุนไพรส่วนใหญ่ควรอยู่ในช่วงใด?',
    options: [
      '4.0-5.0',
      '6.0-7.0',
      '8.0-9.0',
      '10.0-11.0'
    ],
    correctAnswer: 1,
    explanation: 'pH ของดินที่เหมาะสมสำหรับการปลูกพืชสมุนไพรส่วนใหญ่ควรอยู่ในช่วง 6.0-7.0 ซึ่งเป็นช่วงที่พืชสามารถดูดซับธาตุอาหารได้ดี',
    difficulty: 'hard',
    category: 'cultivation'
  },
  {
    id: 'q9',
    question: 'การจัดเก็บเอกสารและข้อมูลการผลิตตาม GACP ควรเก็บไว้กี่ปี?',
    options: [
      '1 ปี',
      '2 ปี',
      '3 ปี',
      '5 ปี'
    ],
    correctAnswer: 2,
    explanation: 'เอกสารและข้อมูลการผลิตควรเก็บไว้อย่างน้อย 3 ปี เพื่อความสะดวกในการตรวจสอบและติดตาม',
    difficulty: 'medium',
    category: 'documentation'
  },
  {
    id: 'q10',
    question: 'อุณหภูมิสูงสุดที่ควรใช้ในการอบแห้งพืชสมุนไพรคือกี่องศาเซลเซียส?',
    options: [
      '40 องศาเซลเซียส',
      '60 องศาเซลเซียส',
      '80 องศาเซลเซียส',
      '100 องศาเซลเซียส'
    ],
    correctAnswer: 1,
    explanation: 'อุณหภูมิในการอบแห้งไม่ควรเกิน 60 องศาเซลเซียส เพื่อป้องกันการสูญเสียสารสำคัญในพืชสมุนไพร',
    difficulty: 'hard',
    category: 'quality_control'
  }
];

const VIDEO_LESSONS: VideoLesson[] = [
  {
    id: 'v1',
    title: 'บทนำสู่มาตรฐาน GACP',
    description: 'เรียนรู้พื้นฐานของมาตรฐาน Good Agricultural and Collection Practices',
    duration: 15,
    thumbnail: '/api/placeholder/320/180',
    videoUrl: '/videos/gacp-intro.mp4',
    watched: false
  },
  {
    id: 'v2',
    title: 'การเตรียมดินและสภาพแวดล้อม',
    description: 'วิธีการเตรียมดินและจัดการสภาพแวดล้อมให้เหมาะสมกับการปลูกพืชสมุนไพร',
    duration: 20,
    thumbnail: '/api/placeholder/320/180',
    videoUrl: '/videos/soil-preparation.mp4',
    watched: false
  },
  {
    id: 'v3',
    title: 'เทคนิคการปลูกและดูแลรักษา',
    description: 'เทคนิคการปลูก การใส่ปุ๋ย และการดูแลรักษาพืชสมุนไพรอย่างถูกต้อง',
    duration: 25,
    thumbnail: '/api/placeholder/320/180',
    videoUrl: '/videos/cultivation-techniques.mp4',
    watched: false
  },
  {
    id: 'v4',
    title: 'การเก็บเกี่ยวและการจัดการหลังการเก็บเกี่ยว',
    description: 'วิธีการเก็บเกี่ยวที่ถูกต้องและการจัดการหลังการเก็บเกี่ยวเพื่อรักษาคุณภาพ',
    duration: 18,
    thumbnail: '/api/placeholder/320/180',
    videoUrl: '/videos/harvesting.mp4',
    watched: false
  }
];

interface KnowledgeTestModuleProps {
  userId: string;
  onTestCompleted: (result: TestResult) => void;
}

export const KnowledgeTestModule: React.FC<KnowledgeTestModuleProps> = ({ 
  userId, 
  onTestCompleted 
}) => {
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'videos' | 'test' | 'results'>('intro');
  const [videos, setVideos] = useState<VideoLesson[]>(VIDEO_LESSONS);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testStarted && currentPhase === 'test') {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - testStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testStartTime, currentPhase]);

  const allVideosWatched = videos.every(video => video.watched);
  const currentQuestion = KNOWLEDGE_TEST_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === KNOWLEDGE_TEST_QUESTIONS.length - 1;

  const markVideoAsWatched = (videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, watched: true } : video
    ));
    toast({
      title: "เสร็จสิ้นการเรียนรู้",
      description: "คุณได้ดูวิดีโอบทเรียนเสร็จสิ้นแล้ว",
    });
  };

  const startTest = () => {
    if (!allVideosWatched) {
      toast({
        title: "กรุณาดูวิดีโอให้ครบก่อน",
        description: "คุณต้องดูวิดีโอบทเรียนทั้งหมดก่อนเข้าสอบ",
        variant: "destructive"
      });
      return;
    }
    
    setTestStarted(true);
    setTestStartTime(Date.now());
    setCurrentPhase('test');
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (isLastQuestion) {
      completeTest();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeTest = () => {
    const totalQuestions = KNOWLEDGE_TEST_QUESTIONS.length;
    let correctAnswers = 0;

    KNOWLEDGE_TEST_QUESTIONS.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 60; // 60% passing score

    const result: TestResult = {
      id: Date.now().toString(),
      userId,
      score: correctAnswers,
      totalQuestions,
      percentage,
      timeSpent,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers,
      passed
    };

    setTestResult(result);
    setCurrentPhase('results');
    onTestCompleted(result);

    toast({
      title: passed ? "ยินดีด้วย! ทดสอบผ่าน" : "ทดสอบไม่ผ่าน",
      description: `คุณได้คะแนน ${correctAnswers}/${totalQuestions} (${percentage}%)`,
      variant: passed ? "default" : "destructive"
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gacp_basics': return <BookOpen className="h-4 w-4" />;
      case 'cultivation': return <Target className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'quality_control': return <Award className="h-4 w-4" />;
      case 'regulations': return <Brain className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderIntroduction = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">แบบทดสอบความรู้ GACP</h2>
        <p className="text-muted-foreground">
          ทดสอบความรู้เกี่ยวกับมาตรฐาน Good Agricultural and Collection Practices
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">ข้อมูลสำคัญ</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>จำนวนคำถาม: {KNOWLEDGE_TEST_QUESTIONS.length} ข้อ</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span>เวลาไม่จำกัด (แต่ควรทำให้เสร็จภายใน 30 นาที)</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>คะแนนผ่าน: 60% (6 ข้อขึ้นไป)</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-secondary" />
              <span>ต้องดูวิดีโอบทเรียนครบทุกบทก่อนเข้าสอบ</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            หัวข้อการทดสอบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm">พื้นฐาน GACP</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-success" />
                <span className="text-sm">เทคนิคการปลูก</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-warning" />
                <span className="text-sm">เอกสารและการจัดเก็บ</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-secondary" />
                <span className="text-sm">การควบคุมคุณภาพ</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                <span className="text-sm">กฎระเบียบและข้อบังคับ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={() => setCurrentPhase('videos')}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Video className="mr-2 h-4 w-4" />
          เริ่มต้นการเรียนรู้
        </Button>
      </div>
    </div>
  );

  const renderVideos = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Video className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">วิดีโอบทเรียน</h2>
        <p className="text-muted-foreground">
          ดูวิดีโอบทเรียนให้ครบทุกบทก่อนเข้าสู่การทดสอบ
        </p>
      </div>

      <div className="grid gap-6">
        {videos.map((video, index) => (
          <Card key={video.id} className={`hover:shadow-md transition-shadow ${video.watched ? 'border-success/50 bg-success/5' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="aspect-video w-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{video.title}</h3>
                    {video.watched && (
                      <Badge variant="default" className="bg-success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        เสร็จสิ้น
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3">{video.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{video.duration} นาที</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => markVideoAsWatched(video.id)}
                    variant={video.watched ? "outline" : "default"}
                    disabled={video.watched}
                    className="w-full sm:w-auto"
                  >
                    {video.watched ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        ดูแล้ว
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        ดูวิดีโอ
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>ความคืบหน้า</span>
            <span>{videos.filter(v => v.watched).length}/{videos.length}</span>
          </div>
          <Progress 
            value={(videos.filter(v => v.watched).length / videos.length) * 100} 
            className="h-2" 
          />
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={startTest}
          size="lg"
          disabled={!allVideosWatched}
          className="w-full sm:w-auto"
        >
          <Brain className="mr-2 h-4 w-4" />
          {allVideosWatched ? 'เริ่มทำแบบทดสอบ' : 'ดูวิดีโอให้ครบก่อน'}
        </Button>
      </div>
    </div>
  );

  const renderTest = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">แบบทดสอบความรู้ GACP</h2>
          <p className="text-muted-foreground">
            ข้อ {currentQuestionIndex + 1} จาก {KNOWLEDGE_TEST_QUESTIONS.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">เวลาที่ใช้</div>
          <div className="text-xl font-mono">{formatTime(timeSpent)}</div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>ความคืบหน้า</span>
          <span>{currentQuestionIndex + 1}/{KNOWLEDGE_TEST_QUESTIONS.length}</span>
        </div>
        <Progress 
          value={((currentQuestionIndex + 1) / KNOWLEDGE_TEST_QUESTIONS.length) * 100} 
          className="h-2" 
        />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              {getCategoryIcon(currentQuestion.category)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.difficulty === 'easy' ? 'ง่าย' : 
                     currentQuestion.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          ← คำถามก่อนหน้า
        </Button>
        
        <Button
          onClick={nextQuestion}
          disabled={selectedAnswers[currentQuestion.id] === undefined}
        >
          {isLastQuestion ? 'ส่งคำตอบ' : 'คำถามถัดไป →'}
        </Button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!testResult) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            testResult.passed ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {testResult.passed ? (
              <Award className="h-8 w-8" />
            ) : (
              <Brain className="h-8 w-8" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {testResult.passed ? 'ยินดีด้วย! คุณผ่านการทดสอบ' : 'ไม่ผ่านการทดสอบ'}
          </h2>
          <p className="text-muted-foreground">
            {testResult.passed 
              ? 'คุณสามารถสร้างใบสมัครใหม่ได้แล้ว' 
              : 'คุณสามารถทำแบบทดสอบใหม่ได้อีกครั้ง'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {testResult.score}/{testResult.totalQuestions}
                </div>
                <div className="text-muted-foreground">คะแนนที่ได้</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {testResult.percentage}%
                </div>
                <div className="text-muted-foreground">เปอร์เซ็นต์</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatTime(testResult.timeSpent)}
                </div>
                <div className="text-muted-foreground">เวลาที่ใช้</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  testResult.passed ? 'text-success' : 'text-destructive'
                }`}>
                  {testResult.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                </div>
                <div className="text-muted-foreground">ผลการทดสอบ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card>
          <CardHeader>
            <CardTitle>ผลการตอบคำถาม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {KNOWLEDGE_TEST_QUESTIONS.map((question, index) => {
                const userAnswer = testResult.answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">{question.question}</h4>
                        <div className="text-sm space-y-1">
                          <div className={`p-2 rounded ${isCorrect ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            <strong>คำตอบของคุณ:</strong> {question.options[userAnswer] || 'ไม่ได้ตอบ'}
                          </div>
                          {!isCorrect && (
                            <div className="p-2 rounded bg-success/10">
                              <strong>คำตอบที่ถูกต้อง:</strong> {question.options[question.correctAnswer]}
                            </div>
                          )}
                          <div className="p-2 rounded bg-muted">
                            <strong>คำอธิบาย:</strong> {question.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          {testResult.passed ? (
            <Button size="lg" onClick={() => window.location.href = '/applicant/application/new'}>
              <Award className="mr-2 h-4 w-4" />
              สร้างใบสมัครใหม่
            </Button>
          ) : (
            <Button size="lg" onClick={() => window.location.reload()}>
              <Brain className="mr-2 h-4 w-4" />
              ทำแบบทดสอบใหม่
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentPhase === 'intro' && renderIntroduction()}
      {currentPhase === 'videos' && renderVideos()}
      {currentPhase === 'test' && renderTest()}
      {currentPhase === 'results' && renderResults()}
    </div>
  );
};