export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">TechStore</h3>
            <p className="text-gray-400">
              Your one-stop destination for premium tech products and accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/products" className="text-gray-400 hover:text-white">Products</a></li>
              <li><a href="/categories" className="text-gray-400 hover:text-white">Categories</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><a href="/shipping" className="text-gray-400 hover:text-white">Shipping Info</a></li>
              <li><a href="/returns" className="text-gray-400 hover:text-white">Returns</a></li>
              <li><a href="/faq" className="text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="/support" className="text-gray-400 hover:text-white">Support</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: support@techstore.com</li>
              <li>Phone: (123) 456-7890</li>
              <li>Address: 123 Tech Street</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} TechStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 