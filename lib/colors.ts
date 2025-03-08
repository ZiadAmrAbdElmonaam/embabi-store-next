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

// Helper function to get human-readable color name
export const getColorName = (colorCode: string) => {
  const colorMap: { [key: string]: string } = {
    'black': 'Black',
    'white': 'White',
    'red': 'Red',
    'green': 'Green',
    'blue': 'Blue',
    'yellow': 'Yellow',
    'purple': 'Purple',
    'pink': 'Pink',
    'gray': 'Gray',
    'brown': 'Brown',
    'orange': 'Orange',
    'navy': 'Navy Blue',
    'gold': 'Gold',
    'silver': 'Silver',
  };
  return colorMap[colorCode.toLowerCase()] || colorCode;
}; 