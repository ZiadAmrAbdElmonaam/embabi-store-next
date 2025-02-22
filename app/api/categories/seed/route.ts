import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const initialCategories = [
  {
    name: "Phones",
    slug: "phones",
    description: "Smartphones and mobile devices"
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Notebooks and laptops"
  },
  {
    name: "Tablets",
    slug: "tablets",
    description: "Tablets and iPads"
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Tech accessories and peripherals"
  }
];

export async function POST() {
  try {
    const categories = await Promise.all(
      initialCategories.map(category =>
        prisma.category.upsert({
          where: { slug: category.slug },
          update: category,
          create: category,
        })
      )
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed categories' },
      { status: 500 }
    );
  }
} 