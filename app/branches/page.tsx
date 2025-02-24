import { MapPin, Clock, Phone } from 'lucide-react';

// You can move this to a separate data file or fetch from an API
const branches = [
  {
    id: 1,
    name: 'Main Store',
    address: '123 Main Street, Downtown',
    city: 'Cairo',
    phone: '+20 123 456 7890',
    hours: 'Mon-Sat: 10:00 AM - 10:00 PM',
    mapUrl: 'https://www.google.com/maps/embed?pb=...', // Add your Google Maps embed URL
    image: '/images/branches/main-store.jpg'
  },
  {
    id: 2,
    name: 'Mall Branch',
    address: 'City Stars Mall, Level 2',
    city: 'Cairo',
    phone: '+20 123 456 7891',
    hours: 'Mon-Sun: 10:00 AM - 11:00 PM',
    mapUrl: 'https://www.google.com/maps/embed?pb=...',
    image: '/images/branches/mall-branch.jpg'
  },
  // Add more branches as needed
];

export default function BranchesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Branches</h1>
          <p className="text-lg text-gray-600">
            Find the nearest store location to you
          </p>
        </div>

        <div className="grid gap-8">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Map Section */}
                <div className="relative h-[300px] md:h-full min-h-[300px]">
                  <iframe
                    src={branch.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>

                {/* Branch Information */}
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {branch.name}
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">Address</h3>
                        <p className="text-gray-600">{branch.address}</p>
                        <p className="text-gray-600">{branch.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">Working Hours</h3>
                        <p className="text-gray-600">{branch.hours}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p className="text-gray-600">{branch.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${branch.address}, ${branch.city}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors w-full md:w-auto"
                  >
                    <MapPin className="h-5 w-5" />
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 