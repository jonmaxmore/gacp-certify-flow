import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export type WorkflowStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING_REVIEW'
  | 'PAYMENT_CONFIRMED_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED_PAYMENT_REQUIRED'
  | 'REVIEW_APPROVED'
  | 'PAYMENT_PENDING_ASSESSMENT'
  | 'PAYMENT_CONFIRMED_ASSESSMENT'
  | 'ONLINE_ASSESSMENT_SCHEDULED'
  | 'ONLINE_ASSESSMENT_IN_PROGRESS'
  | 'ONLINE_ASSESSMENT_COMPLETED'
  | 'ONSITE_ASSESSMENT_SCHEDULED'
  | 'ONSITE_ASSESSMENT_IN_PROGRESS'
  | 'ONSITE_ASSESSMENT_COMPLETED'
  | 'CERTIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED';

export type PaymentMilestone = 
  | 'DOCUMENT_REVIEW'
  | 'ASSESSMENT'
  | 'CERTIFICATION'
  | 'REINSPECTION';

interface WorkflowStatusUpdate {
  applicationId: string;
  newStatus: WorkflowStatus;
  notes?: string;
}

interface PaymentCreation {
  applicationId: string;
  milestone: PaymentMilestone;
  amount: number;
  dueDate?: Date;
}

interface WorkflowData {
  applications: any[];
  userTasks: any;
  loading: boolean;
  error: string | null;
}

export const useWorkflowStatus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    applications: [],
    userTasks: null,
    loading: true,
    error: null
  });

  // Fetch user's workflow data
  const fetchWorkflowData = async () => {
    if (!user) return;

    try {
      setWorkflowData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch applications with workflow status
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          payments:payments!payments_application_id_fkey (*)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch user workflow tasks
      const { data: userTasks, error: tasksError } = await supabase
        .rpc('get_user_workflow_tasks');

      if (tasksError) throw tasksError;

      setWorkflowData({
        applications: applications || [],
        userTasks,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching workflow data:', error);
      setWorkflowData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch workflow data'
      }));
    }
  };

  // Update workflow status
  const updateWorkflowStatus = async ({ 
    applicationId, 
    newStatus, 
    notes 
  }: WorkflowStatusUpdate): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('update_workflow_status', {
          p_application_id: applicationId,
          p_new_status: newStatus,
          p_updated_by: user.id,
          p_notes: notes
        });

      if (error) throw error;

      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: "สถานะการดำเนินการได้รับการอัปเดตแล้ว",
      });

      // Refresh data
      await fetchWorkflowData();
      return true;

    } catch (error: any) {
      console.error('Error updating workflow status:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดตสถานะได้",
        variant: "destructive",
      });
      return false;
    }
  };

  // Create payment record
  const createPaymentRecord = async ({
    applicationId,
    milestone,
    amount,
    dueDate
  }: PaymentCreation): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .rpc('create_payment_record', {
          p_application_id: applicationId,
          p_milestone: milestone, // milestone is already a number
          p_amount: amount,
          p_due_date: dueDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      if (data) {
        // Create invoice for the payment
        const { data: invoiceId, error: invoiceError } = await supabase.rpc('create_invoice_from_payment', {
          p_payment_id: data
        });

        if (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
        }

        toast({
          title: "สร้างใบแจ้งหนี้สำเร็จ",
          description: "ระบบได้สร้างใบแจ้งหนี้และรายการชำระเงินแล้ว",
        });

        // Refresh data
        await fetchWorkflowData();
        return data;
      }

      return null;

    } catch (error: any) {
      console.error('Error creating payment record:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างรายการชำระเงินได้",
        variant: "destructive",
      });
      return null;
    }
  };

  // Mark payment as completed
  const markPaymentCompleted = async (paymentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'COMPLETED',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "ชำระเงินสำเร็จ",
        description: "การชำระเงินได้รับการยืนยันแล้ว",
      });

      // Refresh data
      await fetchWorkflowData();
      return true;

    } catch (error: any) {
      console.error('Error marking payment as completed:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดตสถานะการชำระเงินได้",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get workflow progress percentage
  const getWorkflowProgress = (status: WorkflowStatus): number => {
    const statusOrder: WorkflowStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'PAYMENT_PENDING_REVIEW',
      'PAYMENT_CONFIRMED_REVIEW',
      'UNDER_REVIEW',
      'REVISION_REQUESTED',
      'REJECTED_PAYMENT_REQUIRED',
      'REVIEW_APPROVED',
      'PAYMENT_PENDING_ASSESSMENT',
      'PAYMENT_CONFIRMED_ASSESSMENT',
      'ONLINE_ASSESSMENT_SCHEDULED',
      'ONLINE_ASSESSMENT_COMPLETED',
      'ONSITE_ASSESSMENT_SCHEDULED',
      'ONSITE_ASSESSMENT_COMPLETED',
      'CERTIFIED'
    ];

    const currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) return 0;

    // Special handling for rejection scenarios
    if (status === 'REVISION_REQUESTED' || status === 'REJECTED_PAYMENT_REQUIRED') {
      return 30; // Show as being in review stage
    }

    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  };

  // Get next required action
  const getNextAction = (status: WorkflowStatus): string | null => {
    const actionMap: Record<WorkflowStatus, string | null> = {
      'DRAFT': 'กรอกข้อมูลให้ครบถ้วนและส่งใบสมัคร',
      'SUBMITTED': 'รอการตรวจสอบเบื้องต้น',
      'PAYMENT_PENDING_REVIEW': 'ชำระค่าตรวจเอกสาร 5,000 บาท',
      'PAYMENT_CONFIRMED_REVIEW': 'รอการตรวจสอบเอกสาร',
      'UNDER_REVIEW': 'รอผลการตรวจสอบเอกสาร',
      'REVISION_REQUESTED': 'แก้ไขเอกสารตามข้อเสนอแนะ',
      'REJECTED_PAYMENT_REQUIRED': 'ชำระค่าธรรมเนียม 5,000 บาท เพื่อส่งเอกสารใหม่',
      'REVIEW_APPROVED': 'เอกสารผ่านการตรวจสอบ',
      'PAYMENT_PENDING_ASSESSMENT': 'ชำระค่าประเมิน 25,000 บาท',
      'PAYMENT_CONFIRMED_ASSESSMENT': 'รอการจัดตารางเวลาประเมิน',
      'ONLINE_ASSESSMENT_SCHEDULED': 'เข้าร่วมการประเมินออนไลน์',
      'ONLINE_ASSESSMENT_IN_PROGRESS': 'การประเมินออนไลน์กำลังดำเนินการ',
      'ONLINE_ASSESSMENT_COMPLETED': 'รอการจัดตารางประเมินในพื้นที่',
      'ONSITE_ASSESSMENT_SCHEDULED': 'รอการประเมินในพื้นที่',
      'ONSITE_ASSESSMENT_IN_PROGRESS': 'การประเมินในพื้นที่กำลังดำเนินการ',
      'ONSITE_ASSESSMENT_COMPLETED': 'รอผลการประเมิน',
      'CERTIFIED': 'ได้รับใบรับรอง GACP แล้ว',
      'REJECTED': 'ใบสมัครถูกปฏิเสธ',
      'EXPIRED': 'ใบสมัครหมดอายุ',
      'REVOKED': 'ใบรับรองถูกเพิกถอน'
    };

    return actionMap[status] || null;
  };

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchWorkflowData();
    }
  }, [user]);

  return {
    ...workflowData,
    updateWorkflowStatus,
    createPaymentRecord,
    markPaymentCompleted,
    getWorkflowProgress,
    getNextAction,
    refetch: fetchWorkflowData
  };
};