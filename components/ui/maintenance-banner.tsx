'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceBannerProps {
  className?: string;
}

export function MaintenanceBanner({ className }: MaintenanceBannerProps) {
  const [isInMaintenance, setIsInMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings/maintenance');
        const data = await response.json();
        
        setIsInMaintenance(data.maintenanceMode);
        setMessage(data.maintenanceMessage);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  if (isLoading || !isInMaintenance) {
    return null;
  }

  return (
    <div className={cn(
      'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4',
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Attention:</span> {message}
          </p>
        </div>
      </div>
    </div>
  );
} 