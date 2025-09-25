import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowAction {
  id: string;
  type: 'payment' | 'meeting' | 'certificate' | 'status_update';
  title: string;
  description: string;
  amount?: number;
  dueDate?: Date;
  meetingDate?: Date;
  requiredFields?: string[];
  nextStatus?: string;
}

export const useWorkflowIntegration = () => {
  const { toast } = useToast();

  // Process payment completion and trigger next workflow step
  const processPaymentCompletion = async (paymentId: string, milestone: number, applicationId: string) => {
    try {
      // Mark payment as completed
      const { error: paymentError } = await supabase
        .rpc('mark_invoice_paid', {
          p_invoice_id: paymentId,
          p_payment_method: 'online'
        });

      if (paymentError) throw paymentError;

      // Determine next workflow status based on milestone
      let nextStatus: any = '';
      let nextAction = '';

      switch (milestone) {
        case 1: // Document review payment
          nextStatus = 'UNDER_REVIEW' as const;
          nextAction = 'Document review process will begin';
          break;
        case 2: // Assessment payment
          nextStatus = 'PAYMENT_CONFIRMED_ASSESSMENT' as const;
          nextAction = 'Assessment scheduling will begin';
          // Trigger assessment scheduling
          await scheduleAssessment(applicationId);
          break;
        case 3: // Certificate payment (if needed)
          nextStatus = 'CERTIFIED' as const;
          nextAction = 'Certificate generation will begin';
          // Trigger certificate generation
          await generateCertificate(applicationId);
          break;
      }

      // Update workflow status
      if (nextStatus) {
        const { error: statusError } = await supabase
          .rpc('update_workflow_status_v2', {
            p_application_id: applicationId,
            p_new_status: nextStatus,
            p_updated_by: (await supabase.auth.getUser()).data.user?.id,
            p_notes: `Payment milestone ${milestone} completed`
          });

        if (statusError) console.error('Error updating workflow status:', statusError);
      }

      toast({
        title: "ชำระเงินสำเร็จ",
        description: nextAction,
        variant: "default",
      });

      return true;
    } catch (error: any) {
      console.error('Error processing payment completion:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถดำเนินการต่อได้",
        variant: "destructive",
      });
      return false;
    }
  };

  // Schedule assessment after payment
  const scheduleAssessment = async (applicationId: string) => {
    try {
      // First schedule online assessment
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7); // Schedule 7 days from now

      const { data, error } = await supabase.functions.invoke('generate-assessment-meeting', {
        body: {
          applicationId,
          assessmentType: 'online',
          scheduledDate: scheduledDate.toISOString(),
        }
      });

      if (error) throw error;

      console.log('Assessment scheduled:', data);
      return data;
    } catch (error) {
      console.error('Error scheduling assessment:', error);
    }
  };

  // Generate certificate PDF
  const generateCertificate = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('certificate-pdf-generator', {
        body: { applicationId }
      });

      if (error) throw error;

      console.log('Certificate generated:', data);
      return data;
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  // Get next required actions for a workflow status
  const getNextActions = (status: string, revisionCount: number = 0): WorkflowAction[] => {
    const actions: WorkflowAction[] = [];

    switch (status) {
      case 'DRAFT':
        actions.push({
          id: 'complete_application',
          type: 'status_update',
          title: 'กรอกข้อมูลให้ครบถ้วน',
          description: 'กรอกข้อมูลใบสมัครและอัพโหลดเอกสารที่จำเป็น',
          requiredFields: ['applicant_name', 'farm_name', 'farm_address', 'crop_types'],
          nextStatus: 'SUBMITTED'
        });
        break;

      case 'SUBMITTED':
        actions.push({
          id: 'pay_review_fee',
          type: 'payment',
          title: 'ชำระค่าตรวจเอกสาร',
          description: 'ชำระค่าธรรมเนียมการตรวจสอบเอกสาร',
          amount: 5000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
        break;

      case 'REJECTED_PAYMENT_REQUIRED':
        const isFirstTwoRevisions = revisionCount <= 2;
        if (!isFirstTwoRevisions) {
          actions.push({
            id: 'pay_revision_fee',
            type: 'payment',
            title: 'ชำระค่าแก้ไขเอกสาร',
            description: `ชำระค่าธรรมเนียมการแก้ไขเอกสารครั้งที่ ${revisionCount}`,
            amount: 5000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        }
        break;

      case 'REVIEW_APPROVED':
        actions.push({
          id: 'pay_assessment_fee',
          type: 'payment',
          title: 'ชำระค่าประเมิน',
          description: 'ชำระค่าธรรมเนียมการประเมินออนไลน์และในพื้นที่',
          amount: 25000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        break;

      case 'ONLINE_ASSESSMENT_SCHEDULED':
        actions.push({
          id: 'join_online_assessment',
          type: 'meeting',
          title: 'เข้าร่วมการประเมินออนไลน์',
          description: 'เข้าร่วมการประเมินออนไลน์ตามวันเวลาที่กำหนด',
          meetingDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Example: tomorrow
        });
        break;

      case 'ONSITE_ASSESSMENT_SCHEDULED':
        actions.push({
          id: 'prepare_onsite_assessment',
          type: 'meeting',
          title: 'เตรียมพร้อมสำหรับการประเมินในพื้นที่',
          description: 'เตรียมพื้นที่ฟาร์มและเอกสารสำหรับการประเมินในพื้นที่',
          meetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Example: next week
        });
        break;

      case 'CERTIFIED':
        actions.push({
          id: 'download_certificate',
          type: 'certificate',
          title: 'ดาวน์โหลดใบรับรอง',
          description: 'ใบรับรองมาตรฐาน GACP พร้อมใช้งานแล้ว'
        });
        break;
    }

    return actions;
  };

  // Check if user can proceed to next step
  const canProceedToNextStep = async (applicationId: string): Promise<boolean> => {
    try {
      const { data: application, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !application) return false;

      // Check if required fields are filled
      const requiredFields = ['applicant_name', 'farm_name', 'farm_address', 'crop_types'];
      const isComplete = requiredFields.every(field => application[field]);

      // Check if there are pending payments
      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('application_id', applicationId)
        .eq('status', 'PENDING');

      return isComplete && (!pendingPayments || pendingPayments.length === 0);
    } catch (error) {
      console.error('Error checking if can proceed:', error);
      return false;
    }
  };

  return {
    processPaymentCompletion,
    scheduleAssessment,
    generateCertificate,
    getNextActions,
    canProceedToNextStep
  };
};

export default useWorkflowIntegration;