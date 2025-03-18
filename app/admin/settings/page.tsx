'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        setIsMaintenanceMode(data.maintenanceMode);
        setMaintenanceMessage(data.maintenanceMessage || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maintenanceMode: isMaintenanceMode,
          maintenanceMessage: maintenanceMessage || 'Site is under maintenance. Please try again later.',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      
      {isLoading ? (
        <div className="flex justify-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Maintenance Mode Banner (when enabled) */}
          {isMaintenanceMode && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">Warning:</span> Maintenance mode is currently enabled. 
                    Users cannot place orders while this mode is active.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Maintenance Mode Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500">
                    Enable maintenance mode to prevent users from placing orders.
                    This is useful during price updates or system maintenance.
                  </p>
                </div>
                <div className="relative inline-block w-14 align-middle select-none">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    id="maintenanceMode"
                    checked={isMaintenanceMode}
                    onChange={() => setIsMaintenanceMode(!isMaintenanceMode)}
                    className="sr-only"
                  />
                  <div 
                    className={`block h-8 rounded-full cursor-pointer ${isMaintenanceMode ? 'bg-blue-800' : 'bg-gray-200'}`}
                    onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                      isMaintenanceMode ? "transform translate-x-6 bg-blue-600" : ""
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Maintenance Message */}
            <div>
              <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Message
              </label>
              <textarea
                id="maintenanceMessage"
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="Message to display to users during maintenance"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
              />
              <p className="mt-1 text-sm text-gray-500">
                This message will be displayed to users when maintenance mode is enabled.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 