import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ListOrdered, 
  Users,
  FolderTree,
  AlertTriangle
} from "lucide-react";

export function AdminSidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/admin" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/admin/products" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Package className="w-5 h-5" />
          <span>Products</span>
        </Link>
        
        <Link 
          href="/admin/categories" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <FolderTree className="w-5 h-5" />
          <span>Categories</span>
        </Link>
        
        <Link 
          href="/admin/orders" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <ListOrdered className="w-5 h-5" />
          <span>Orders</span>
        </Link>
        
        <Link 
          href="/admin/users" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Users className="w-5 h-5" />
          <span>Users</span>
        </Link>
        
        <div className="border-t border-gray-700 my-4"></div>
        
        <Link 
          href="/admin/reset-db" 
          className="flex items-center space-x-2 p-2 hover:bg-red-700 bg-red-900 rounded text-white"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Reset Database</span>
        </Link>
      </nav>
    </div>
  );
} 