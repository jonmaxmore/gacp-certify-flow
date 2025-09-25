import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LoginTestHelper = () => {
  const { signIn, loading } = useAuth();

  const testUsers = [
    { email: 'pass.gob1@gmail.com', password: 'password123', role: 'admin' },
    { email: 'farmer@gmail.com', password: 'password123', role: 'applicant' },
    { email: 'auditor01@gmail.com', password: 'password123', role: 'auditor' },
    { email: 'reviewer02@gmail.com', password: 'password123', role: 'applicant' },
  ];

  const handleTestLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg text-center">🧪 Test Login Helper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          เข้าสู่ระบบด้วยบัญชีทดสอบ:
        </p>
        <div className="grid gap-2">
          {testUsers.map((user) => (
            <Button
              key={user.email}
              variant="outline"
              size="sm"
              onClick={() => handleTestLogin(user.email, user.password)}
              disabled={loading}
              className="text-left justify-start"
            >
              <div className="text-xs">
                <div className="font-medium">{user.role.toUpperCase()}</div>
                <div className="text-muted-foreground">{user.email}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};