import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sprout as Seedling, 
  Droplets, 
  Thermometer, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Leaf,
  Target,
  TrendingUp,
  Plus
} from 'lucide-react';

interface CropData {
  id: string;
  variety: string;
  strain: string;
  plantedDate: string;
  harvestDate: string;
  quantity: number;
  status: 'germination' | 'vegetative' | 'flowering' | 'harvest' | 'cured';
  healthScore: number;
  compliance: boolean;
}

interface FarmStats {
  totalPlants: number;
  activeCrops: number;
  upcomingHarvest: number;
  complianceRate: number;
}

export const FarmManagementDashboard = () => {
  const [crops, setCrops] = useState<CropData[]>([]);
  const [stats, setStats] = useState<FarmStats>({
    totalPlants: 0,
    activeCrops: 0,
    upcomingHarvest: 0,
    complianceRate: 100
  });

  // Mock data - in real app would fetch from database
  useEffect(() => {
    const mockCrops: CropData[] = [
      {
        id: '1',
        variety: 'Cannabis Sativa L.',
        strain: 'CBD-Rich Hemp',
        plantedDate: '2024-01-15',
        harvestDate: '2024-04-15',
        quantity: 250,
        status: 'flowering',
        healthScore: 95,
        compliance: true
      },
      {
        id: '2',
        variety: 'Cannabis Sativa L.',
        strain: 'Industrial Hemp',
        plantedDate: '2024-02-01',
        harvestDate: '2024-05-01',
        quantity: 180,
        status: 'vegetative',
        healthScore: 92,
        compliance: true
      },
      {
        id: '3',
        variety: 'Medicinal Cannabis',
        strain: 'High-CBD',
        plantedDate: '2024-03-01',
        harvestDate: '2024-06-01',
        quantity: 100,
        status: 'germination',
        healthScore: 88,
        compliance: false
      }
    ];

    setCrops(mockCrops);
    setStats({
      totalPlants: mockCrops.reduce((sum, crop) => sum + crop.quantity, 0),
      activeCrops: mockCrops.filter(crop => crop.status !== 'harvest').length,
      upcomingHarvest: mockCrops.filter(crop => crop.status === 'flowering').length,
      complianceRate: (mockCrops.filter(crop => crop.compliance).length / mockCrops.length) * 100
    });
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      germination: { label: 'งอก', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      vegetative: { label: 'โตเติบโต', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      flowering: { label: 'ออกดอก', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' },
      harvest: { label: 'เก็บเกี่ยว', variant: 'default' as const, color: 'bg-orange-100 text-orange-800' },
      cured: { label: 'บ่มเสร็จ', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.germination;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Farm Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">พืชทั้งหมด</p>
                <p className="text-2xl font-bold">{stats.totalPlants}</p>
              </div>
              <Seedling className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">พันธุ์ที่ปลูก</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeCrops}</p>
              </div>
              <Leaf className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">พร้อมเก็บเกี่ยว</p>
                <p className="text-2xl font-bold text-orange-600">{stats.upcomingHarvest}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ความถูกต้อง</p>
                <p className="text-2xl font-bold text-primary">{stats.complianceRate.toFixed(0)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Seedling className="h-5 w-5" />
            การติดตามพันธุ์พืช (Seed-to-Sale)
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มพันธุ์ใหม่
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {crops.map((crop) => (
              <div key={crop.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{crop.variety}</h4>
                      {getStatusBadge(crop.status)}
                      {crop.compliance ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ถูกต้อง
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          ต้องตรวจสอบ
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      สายพันธุ์: {crop.strain} | จำนวน: {crop.quantity} ต้น
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>ปลูก: {new Date(crop.plantedDate).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>เก็บเกี่ยว: {new Date(crop.harvestDate).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>สุขภาพพืช: {crop.healthScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Health Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">สุขภาพพืช</span>
                    <span className="font-medium">{crop.healthScore}%</span>
                  </div>
                  <Progress 
                    value={crop.healthScore} 
                    className={`h-2 ${getHealthColor(crop.healthScore)}`}
                  />
                </div>

                {/* Environmental Indicators */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-blue-100 rounded">
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ความชื้น</p>
                      <p className="font-medium">65%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-orange-100 rounded">
                      <Thermometer className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">อุณหภูมิ</p>
                      <p className="font-medium">24°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-green-100 rounded">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">pH ดิน</p>
                      <p className="font-medium">6.8</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            การแจ้งเตือนความถูกต้อง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">พันธุ์ High-CBD ต้องการการตรวจสอบ</p>
                <p className="text-sm text-orange-600 mt-1">
                  ระดับ CBD ต้องไม่เกิน 1% ตามกฎหมาย กรุณาตรวจสอบผลการทดสอบล่าสุด
                </p>
                <Button size="sm" variant="outline" className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100">
                  ตรวจสอบรายละเอียด
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};