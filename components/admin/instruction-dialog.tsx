'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface InstructionDialogProps {
  title: string;
  instructions: { step: number; title: string; description: string; details?: string[] }[];
}

export function InstructionDialog({ title, instructions }: InstructionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
      >
        <HelpCircle className="w-4 h-4" />
        {t('admin.howToAdd')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {instructions.map((instruction) => (
                  <div
                    key={instruction.step}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm">
                        {instruction.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {instruction.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-2">
                        {instruction.description}
                      </p>
                      {instruction.details && instruction.details.length > 0 && (
                        <ul className="space-y-1 ml-4">
                          {instruction.details.map((detail, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                {t('admin.gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
