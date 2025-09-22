import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, BookOpen, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  modules: CourseModule[];
  quiz?: Quiz;
}

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'interactive';
  duration: number;
  completed: boolean;
  content_url?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passing_score: number;
  attempts_left: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string | number;
}

export const ELearningModule: React.FC = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    // Load courses - in real app, this would be from API
    loadCourses();
  }, []);

  const loadCourses = () => {
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'มาตรฐาน GACP สำหรับพืชสมุนไพร',
        description: 'เรียนรู้หลักการพื้นฐานของมาตรฐาน Good Agricultural and Collection Practices',
        duration: 120,
        status: 'not_started',
        progress: 0,
        modules: [
          {
            id: 'm1',
            title: 'บทนำ GACP',
            type: 'video',
            duration: 30,
            completed: false,
          },
          {
            id: 'm2',
            title: 'การจัดการดิน น้ำ และสภาพแวดล้อม',
            type: 'reading',
            duration: 45,
            completed: false,
          },
          {
            id: 'm3',
            title: 'การเก็บเกี่ยวและการจัดเก็บหลังการเก็บเกี่ยว',
            type: 'video',
            duration: 35,
            completed: false,
          },
        ],
        quiz: {
          id: 'q1',
          title: 'แบบทดสอบ GACP พื้นฐาน',
          passing_score: 80,
          attempts_left: 3,
          questions: [
            {
              id: 'q1_1',
              question: 'GACP ย่อมาจากอะไร?',
              type: 'multiple_choice',
              options: [
                'Good Agricultural and Collection Practices',
                'Good Agriculture and Care Program',
                'General Agricultural Control Process',
                'Global Agriculture Certification Program'
              ],
              correct_answer: 0
            },
            {
              id: 'q1_2',
              question: 'การจัดการดินในระบบ GACP ต้องคำนึงถึงความยั่งยืนของสิ่งแวดล้อม',
              type: 'true_false',
              options: ['จริง', 'เท็จ'],
              correct_answer: 0
            }
          ]
        }
      }
    ];
    setCourses(mockCourses);
  };

  const startCourse = (course: Course) => {
    setSelectedCourse(course);
    const firstIncompleteModule = course.modules.find(m => !m.completed);
    if (firstIncompleteModule) {
      setCurrentModule(firstIncompleteModule);
    }
  };

  const completeModule = (moduleId: string) => {
    if (!selectedCourse) return;

    const updatedCourse = { ...selectedCourse };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex !== -1) {
      updatedCourse.modules[moduleIndex].completed = true;
      
      // Calculate progress
      const completedModules = updatedCourse.modules.filter(m => m.completed).length;
      updatedCourse.progress = (completedModules / updatedCourse.modules.length) * 100;
      
      if (updatedCourse.progress === 100) {
        updatedCourse.status = 'completed';
        setShowQuiz(true);
      } else {
        updatedCourse.status = 'in_progress';
        // Move to next module
        const nextModule = updatedCourse.modules.find(m => !m.completed);
        setCurrentModule(nextModule || null);
      }

      setSelectedCourse(updatedCourse);
      
      // Update in courses list
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));

      toast({
        title: "บทเรียนเสร็จสิ้น",
        description: `คุณได้เสร็จสิ้นบทเรียน "${updatedCourse.modules[moduleIndex].title}" แล้ว`,
      });
    }
  };

  const renderCourseList = () => (
    <div className="space-y-6">
      <div className="text-center">
        <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">ระบบเรียนรู้ออนไลน์</h2>
        <p className="text-muted-foreground">
          เรียนรู้มาตรฐาน GACP และเตรียมพร้อมสำหรับการสมัครใบรับรอง
        </p>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                  <p className="text-muted-foreground text-sm mb-3">{course.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} นาที</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.modules.length} บทเรียน</span>
                    </div>
                  </div>
                </div>
                
                <Badge variant={
                  course.status === 'completed' ? 'default' : 
                  course.status === 'in_progress' ? 'secondary' : 
                  'outline'
                }>
                  {course.status === 'completed' ? 'เสร็จสิ้น' :
                   course.status === 'in_progress' ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {course.status !== 'not_started' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>ความคืบหน้า</span>
                    <span>{Math.round(course.progress)}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={() => startCourse(course)}
                className="w-full"
                variant={course.status === 'completed' ? 'outline' : 'default'}
              >
                {course.status === 'completed' ? (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    ทบทวนบทเรียน
                  </>
                ) : course.status === 'in_progress' ? (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    เรียนต่อ
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    เริ่มเรียน
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCourseContent = () => {
    if (!selectedCourse || !currentModule) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedCourse(null);
              setCurrentModule(null);
              setShowQuiz(false);
            }}
          >
            ← กลับ
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
            <p className="text-muted-foreground">{currentModule.title}</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {currentModule.type === 'video' ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-6">
                <PlayCircle className="h-16 w-16 text-muted-foreground" />
                <div className="ml-4">
                  <h3 className="font-semibold">วิดีโอบทเรียน</h3>
                  <p className="text-muted-foreground">คลิกเพื่อเล่นวิดีโอ</p>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none mb-6">
                <h3 className="text-lg font-semibold mb-4">{currentModule.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  เนื้อหาของบทเรียนจะแสดงที่นี่ ในระบบจริงจะเป็นเนื้อหาที่ดึงมาจากฐานข้อมูล
                  หรือระบบจัดการเนื้อหา (CMS) ที่ผู้ดูแลระบบสามารถแก้ไขและอัพเดทได้
                </p>
              </div>
            )}

            <Button 
              onClick={() => completeModule(currentModule.id)}
              disabled={currentModule.completed}
              className="w-full"
            >
              {currentModule.completed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  เสร็จสิ้นแล้ว
                </>
              ) : (
                'ทำเครื่องหมายว่าเสร็จสิ้น'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!selectedCourse?.quiz || !showQuiz) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold">แบบทดสอบ</h2>
          <p className="text-muted-foreground">
            ทำแบบทดสอบเพื่อรับใบรับรองการผ่านการอบรม
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedCourse.quiz.title}</CardTitle>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>คะแนนผ่าน: {selectedCourse.quiz.passing_score}%</span>
              <span>จำนวนครั้งที่เหลือ: {selectedCourse.quiz.attempts_left}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              เริ่มทำแบบทดสอบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (showQuiz) {
    return renderQuiz();
  }

  if (selectedCourse && currentModule) {
    return renderCourseContent();
  }

  return renderCourseList();
};