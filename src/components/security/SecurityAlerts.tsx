import React from 'react';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  onResolve?: (alertId: string) => void;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ alerts, onResolve }) => {
  const getAlertIcon = (type: string, resolved: boolean) => {
    if (resolved) return <CheckCircle className="w-5 h-5 text-green-500" />;
    
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Shield className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertVariant = (type: string, resolved: boolean) => {
    if (resolved) return 'secondary';
    
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const resolvedAlerts = alerts.filter(alert => alert.resolved);

  return (
    <div className="space-y-6">
      {unresolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Active Security Alerts ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unresolvedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type, alert.resolved)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{alert.title}</h3>
                      <Badge variant={getAlertVariant(alert.type, alert.resolved)}>
                        {alert.type.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                {onResolve && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resolved Alerts ({resolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resolvedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg opacity-75">
                {getAlertIcon(alert.type, alert.resolved)}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{alert.title}</h3>
                    <Badge variant={getAlertVariant(alert.type, alert.resolved)}>
                      RESOLVED
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-medium text-green-600">All Clear</h3>
              <p className="text-sm text-muted-foreground">No security alerts at this time</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};