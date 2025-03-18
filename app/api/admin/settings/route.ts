import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth-options";

// GET endpoint to retrieve site settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings or create default if not exists
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "site-settings" }
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: "site-settings",
          maintenanceMode: false,
          maintenanceMessage: "Site is under maintenance. Please try again later."
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update site settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate maintenanceMode is provided
    if (data.maintenanceMode === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update settings
    const settings = await prisma.siteSettings.upsert({
      where: { id: "site-settings" },
      update: {
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage || "Site is under maintenance. Please try again later.",
      },
      create: {
        id: "site-settings",
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage || "Site is under maintenance. Please try again later.",
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
} 