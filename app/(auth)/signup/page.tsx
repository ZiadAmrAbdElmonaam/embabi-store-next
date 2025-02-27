import Image from "next/image";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[1000px] mx-4 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Image */}
          <div className="lg:w-1/2 relative bg-orange-50 min-h-[300px] lg:min-h-[600px]">
            <Image
              src="/logo-onepiece.png"
              alt="Sign Up Banner"
              fill
              className="object-contain p-8"
              priority
            />
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                <p className="mt-2 text-sm text-gray-600">Join us and start shopping</p>
              </div>
              <SignUpForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 