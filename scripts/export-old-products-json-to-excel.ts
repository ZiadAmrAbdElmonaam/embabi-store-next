/**
 * Export OLD product data from JSON files to Excel.
 * Reads: public/jsons/Product.json, ProductStorage.json, ProductVariant.json, ProductDetail.json
 * Output: old-products-export.xlsx in project root (4 sheets).
 *
 * Run: npm run export-old-products-excel
 * Use this to compare prices after restructuring products into tables.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const JSONS_DIR = path.join(process.cwd(), 'public', 'jsons');
const OUT_PATH = path.join(process.cwd(), 'old-products-export.xlsx');

function loadJson<T>(filename: string): T {
  const filePath = path.join(JSONS_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/** Flatten value for Excel: array -> pipe-separated string */
function flatten(value: unknown): string | number | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.join(' | ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value as string | number;
}

/** Convert array of objects to rows with stringified arrays */
function toRows<T extends Record<string, unknown>>(items: T[]): Record<string, string | number | null>[] {
  return items.map((item) => {
    const row: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(item)) {
      row[k] = flatten(v) as string | number | null;
    }
    return row;
  });
}

function main() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Product
  const products = loadJson<Record<string, unknown>[]>('Product.json');
  const productRows = toRows(products);
  const wsProduct = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProduct, 'Product');

  // Sheet 2: ProductStorage
  const storages = loadJson<Record<string, unknown>[]>('ProductStorage.json');
  const storageRows = toRows(storages);
  const wsStorage = XLSX.utils.json_to_sheet(storageRows);
  XLSX.utils.book_append_sheet(wb, wsStorage, 'ProductStorage');

  // Sheet 3: ProductVariant
  const variants = loadJson<Record<string, unknown>[]>('ProductVariant.json');
  const variantRows = toRows(variants);
  const wsVariant = XLSX.utils.json_to_sheet(variantRows);
  XLSX.utils.book_append_sheet(wb, wsVariant, 'ProductVariant');

  // Sheet 4: ProductDetail
  const details = loadJson<Record<string, unknown>[]>('ProductDetail.json');
  const detailRows = toRows(details);
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'ProductDetail');

  XLSX.writeFile(wb, OUT_PATH);

  console.log('✅ Old products export complete.');
  console.log(`   Product:       ${productRows.length} rows`);
  console.log(`   ProductStorage: ${storageRows.length} rows`);
  console.log(`   ProductVariant: ${variantRows.length} rows`);
  console.log(`   ProductDetail:  ${detailRows.length} rows`);
  console.log(`   Output: ${OUT_PATH}`);
}

main();
