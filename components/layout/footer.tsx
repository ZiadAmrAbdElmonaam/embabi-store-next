import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6">
              <img 
                src="/images/logo/logo-onepiece.png" 
                alt="Embabi Store Logo" 
                className="h-40 w-auto" 
              />
            </div>
            <p className="text-gray-400 text-center">
              Embabi Store. You are in safe hands 
            </p>
          </div>

          {/* Quick Links */}
          <div className="mt-8 md:mt-0">
            <h4 className="text-lg font-semibold mb-6 text-center md:text-left">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-400 hover:text-white">Products</Link></li>
              <li><Link href="/categories" className="text-gray-400 hover:text-white">Categories</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="mt-8 md:mt-0">
            <h4 className="text-lg font-semibold mb-6 text-center md:text-left">Contact Us</h4>
            <ul className="space-y-3 text-gray-400">
              <li>Email: firedateto@gmail.com</li>
              <li>Phone: +20 10 90202577</li>
              <li>Address: Al-Serag Mall, Nasr City, Cairo, Egypt</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Embabi Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 