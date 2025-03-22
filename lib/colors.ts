// Helper function to get color value from color name
export const getColorValue = (colorName: string) => {
  const colorMap: { [key: string]: string } = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'gray': '#808080',
    'brown': '#A52A2A',
    'orange': '#FFA500',
    'navy': '#000080',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
  };
  return colorMap[colorName.toLowerCase()] || colorName;
};

// Helper function to get human-readable color name based on language
export const getColorName = (colorCode: string, language = 'en') => {
  const isArabic = language === 'ar';
  
  const colorMap: { [key: string]: string } = {
    'black': isArabic ? 'أسود' : 'Black',
    'white': isArabic ? 'أبيض' : 'White',
    'red': isArabic ? 'أحمر' : 'Red',
    'green': isArabic ? 'أخضر' : 'Green',
    'blue': isArabic ? 'أزرق' : 'Blue',
    'yellow': isArabic ? 'أصفر' : 'Yellow',
    'purple': isArabic ? 'بنفسجي' : 'Purple',
    'pink': isArabic ? 'وردي' : 'Pink',
    'gray': isArabic ? 'رمادي' : 'Gray',
    'brown': isArabic ? 'بني' : 'Brown',
    'orange': isArabic ? 'برتقالي' : 'Orange',
    'navy': isArabic ? 'أزرق داكن' : 'Navy Blue',
    'gold': isArabic ? 'ذهبي' : 'Gold',
    'silver': isArabic ? 'فضي' : 'Silver',
    // Handle hex values
    '#000000': isArabic ? 'أسود' : 'Black',
    '#FFFFFF': isArabic ? 'أبيض' : 'White',
    '#FF0000': isArabic ? 'أحمر' : 'Red',
    '#008000': isArabic ? 'أخضر' : 'Green',
    '#0000FF': isArabic ? 'أزرق' : 'Blue',
    '#FFFF00': isArabic ? 'أصفر' : 'Yellow',
    '#800080': isArabic ? 'بنفسجي' : 'Purple',
    '#FFC0CB': isArabic ? 'وردي' : 'Pink',
    '#808080': isArabic ? 'رمادي' : 'Gray',
    '#A52A2A': isArabic ? 'بني' : 'Brown',
    '#FFA500': isArabic ? 'برتقالي' : 'Orange',
    '#000080': isArabic ? 'أزرق داكن' : 'Navy Blue',
    '#FFD700': isArabic ? 'ذهبي' : 'Gold',
    '#C0C0C0': isArabic ? 'فضي' : 'Silver',
  };
  
  return colorMap[colorCode.toLowerCase()] || colorCode;
}; 