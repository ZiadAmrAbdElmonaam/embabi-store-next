/**
 * Smart Category Name Suggestions
 * Generates contextual category names based on parent category
 */

export interface CategorySuggestion {
  name: string;
  description: string;
  icon?: string;
}

export function getCategoryNameSuggestions(
  childName: string, 
  parentName: string
): CategorySuggestion[] {
  if (!childName.trim() || !parentName.trim()) {
    return [];
  }

  const cleanChildName = childName.trim();
  const cleanParentName = parentName.trim().toLowerCase();

  // Define suggestion patterns based on parent categories
  const suggestionMap: { [key: string]: CategorySuggestion[] } = {
    'mobiles': [
      { 
        name: `${cleanChildName} iPhones`, 
        description: 'For iPhone products',
        icon: '📱'
      },
      { 
        name: `${cleanChildName} Phones`, 
        description: 'General mobile phones',
        icon: '📞'
      },
      { 
        name: `${cleanChildName} Mobile`, 
        description: 'Mobile devices',
        icon: '📲'
      },
      { 
        name: `${cleanChildName} Smartphones`, 
        description: 'Smart mobile phones',
        icon: '📱'
      }
    ],
    'mobile phones': [
      { 
        name: `${cleanChildName} iPhones`, 
        description: 'For iPhone products',
        icon: '📱'
      },
      { 
        name: `${cleanChildName} Phones`, 
        description: 'General mobile phones',
        icon: '📞'
      }
    ],
    'smart watches': [
      { 
        name: `${cleanChildName} Watch`, 
        description: 'Smart watches',
        icon: '⌚'
      },
      { 
        name: `${cleanChildName} Wearables`, 
        description: 'Wearable devices',
        icon: '⌚'
      },
      { 
        name: `${cleanChildName} Smartwatch`, 
        description: 'Smart wearable devices',
        icon: '⌚'
      }
    ],
    'smartwatches': [
      { 
        name: `${cleanChildName} Watch`, 
        description: 'Smart watches',
        icon: '⌚'
      },
      { 
        name: `${cleanChildName} Wearables`, 
        description: 'Wearable devices',
        icon: '⌚'
      }
    ],
    'laptops': [
      { 
        name: `${cleanChildName} MacBook`, 
        description: 'MacBook laptops',
        icon: '💻'
      },
      { 
        name: `${cleanChildName} Laptops`, 
        description: 'Laptop computers',
        icon: '💻'
      },
      { 
        name: `${cleanChildName} Notebooks`, 
        description: 'Notebook computers',
        icon: '💻'
      }
    ],
    'tablets': [
      { 
        name: `${cleanChildName} iPad`, 
        description: 'iPad tablets',
        icon: '📱'
      },
      { 
        name: `${cleanChildName} Tablets`, 
        description: 'Tablet devices',
        icon: '📱'
      }
    ],
    'headphones': [
      { 
        name: `${cleanChildName} AirPods`, 
        description: 'Wireless earphones',
        icon: '🎧'
      },
      { 
        name: `${cleanChildName} Headphones`, 
        description: 'Audio headphones',
        icon: '🎧'
      },
      { 
        name: `${cleanChildName} Audio`, 
        description: 'Audio devices',
        icon: '🔊'
      }
    ],
    'gaming': [
      { 
        name: `${cleanChildName} Gaming`, 
        description: 'Gaming products',
        icon: '🎮'
      },
      { 
        name: `${cleanChildName} Console`, 
        description: 'Gaming consoles',
        icon: '🎮'
      }
    ],
    'accessories': [
      { 
        name: `${cleanChildName} Accessories`, 
        description: 'Device accessories',
        icon: '🔌'
      },
      { 
        name: `${cleanChildName} Cases`, 
        description: 'Protective cases',
        icon: '🛡️'
      }
    ],
    'computers': [
      { 
        name: `${cleanChildName} Desktop`, 
        description: 'Desktop computers',
        icon: '🖥️'
      },
      { 
        name: `${cleanChildName} PC`, 
        description: 'Personal computers',
        icon: '💻'
      }
    ]
  };

  // Get suggestions for the parent category
  const suggestions = suggestionMap[cleanParentName] || [
    { 
      name: `${cleanChildName} ${cleanParentName}`, 
      description: `${cleanChildName} products in ${cleanParentName}`,
      icon: '📦'
    }
  ];

  // Always include the original name as an option
  const originalOption: CategorySuggestion = {
    name: cleanChildName,
    description: 'Keep original name',
    icon: '✏️'
  };

  return [originalOption, ...suggestions];
}

/**
 * Generate slug preview for a category name (with parent context)
 */
export function generateSlugPreview(name: string, parentName?: string): string {
  let slug;
  if (parentName && parentName.trim()) {
    // For subcategories: combine child-parent
    slug = `${name}-${parentName}`;
  } else {
    // For main categories: name only
    slug = name;
  }
  
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Check if a category name is likely to be descriptive enough
 */
export function isNameDescriptive(name: string, parentName: string): boolean {
  const cleanName = name.toLowerCase().trim();
  const cleanParent = parentName.toLowerCase().trim();
  
  // If name already includes context, it's descriptive
  if (cleanName.includes(cleanParent)) {
    return true;
  }
  
  // Common descriptive patterns
  const descriptivePatterns = [
    'iphone', 'ipad', 'macbook', 'airpods', 'watch', 'phone', 'laptop', 
    'tablet', 'headphone', 'gaming', 'desktop', 'notebook', 'smartphone'
  ];
  
  return descriptivePatterns.some(pattern => cleanName.includes(pattern));
}
