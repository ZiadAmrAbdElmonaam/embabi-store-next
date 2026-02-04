'use client';

import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ListOrdered, 
  Users,
  FolderTree,
  AlertTriangle,
  Ticket,
  Settings,
  Image
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

export function AdminSidebar() {
  const { t } = useTranslation();

  return (
    <div className="w-64 bg-gray-800 text-white p-4">
      <div className="mb-8 flex items-center">
        <Package className="w-8 h-8 text-orange-500 mr-2" />
        <h1 className="text-xl font-bold">{t('admin.adminPanel')}</h1>
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/admin" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{t('admin.dashboard')}</span>
        </Link>
        
        <Link 
          href="/admin/products" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Package className="w-5 h-5" />
          <span>{t('admin.products')}</span>
        </Link>
        
        <Link 
          href="/admin/categories" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <FolderTree className="w-5 h-5" />
          <span>{t('admin.categories')}</span>
        </Link>
        
        <Link 
          href="/admin/coupons" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Ticket className="w-5 h-5" />
          <span>{t('admin.coupons')}</span>
        </Link>
        
        <Link 
          href="/admin/orders" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <ListOrdered className="w-5 h-5" />
          <span>{t('admin.orders')}</span>
        </Link>
        
        <Link 
          href="/admin/users" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Users className="w-5 h-5" />
          <span>{t('admin.users')}</span>
        </Link>

        <Link 
          href="/admin/carousel" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Image className="w-5 h-5" />
          <span>{t('admin.carousel')}</span>
        </Link>
        
        <Link 
          href="/admin/settings" 
          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded"
        >
          <Settings className="w-5 h-5" />
          <span>{t('admin.settings')}</span>
        </Link>
        
        <div className="border-t border-gray-700 my-4"></div>
        
        <Link 
          href="/admin/reset-db" 
          className="flex items-center space-x-2 p-2 hover:bg-red-700 bg-red-900 rounded text-white"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>{t('admin.resetDatabase')}</span>
        </Link>
      </nav>
    </div>
  );
} 