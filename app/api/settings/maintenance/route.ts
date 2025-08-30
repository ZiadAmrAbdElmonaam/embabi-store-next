import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint to check if the site is in maintenance mode
export async function GET() {
  try {
    // Get settings or return default if not exists
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "site-settings" }
    });

    if (!settings) {
      const response = NextResponse.json({
        maintenanceMode: false,
        maintenanceMessage: ""
      });
      
      // Add caching headers - cache for 2 minutes (maintenance settings don't change often)
      response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
      
      return response;
    }

    const response = NextResponse.json({
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage
    });
    
    // Add caching headers - cache for 2 minutes (maintenance settings don't change often)
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
    
    return response;
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // Default to non-maintenance mode in case of error
    return NextResponse.json({
      maintenanceMode: false,
      maintenanceMessage: ""
    });
  }
} 