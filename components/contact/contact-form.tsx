'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { TranslatedContent } from '@/components/ui/translated-content';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast.success(t('contact.messageSent'));
      toast.success('Your message has been sent to our team!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      toast.error(t('contact.messageFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">There was an error sending your message</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-sm text-red-700">
                Please try again later or contact us directly at{' '}
                <a href="mailto:embabistore110@gmail.com" className="font-medium underline">
                  embabistore110@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-medium"><TranslatedContent translationKey="contact.email" /></h3>
              <p className="text-gray-600">embabistore110@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-medium"><TranslatedContent translationKey="contact.phone" /></h3>
              <p className="text-gray-600"><TranslatedContent translationKey="footer.mobile" /></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-medium"><TranslatedContent translationKey="contact.address" /></h3>
              <p className="text-gray-600"><TranslatedContent translationKey="footer.addressText2" /></p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedContent translationKey="contact.name" />
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedContent translationKey="contact.email" />
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatedContent translationKey="contact.subject" />
            </label>
            <input
              type="text"
              id="subject"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatedContent translationKey="contact.message" />
            </label>
            <textarea
              id="message"
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t('contact.sending')}</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>{t('contact.sendMessage')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 