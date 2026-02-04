/**
 * Compare prices between old JSON files (public/jsons/) and new JSON files (public/newJsons/).
 * Verifies that prices match correctly after restructuring.
 *
 * Run: npm run compare-json-prices
 */

import * as fs from 'fs';
import * as path from 'path';

const OLD_JSONS_DIR = path.join(process.cwd(), 'public', 'jsons');
const NEW_JSONS_DIR = path.join(process.cwd(), 'public', 'newJsons');

function loadJson<T>(filename: string, dir: string): T {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

type OldProduct = {
  id: string;
  price: string;
  stock: number;
};

type OldProductStorage = {
  id: string;
  productId: string;
  price: string;
  stock: number;
};

type NewProduct = {
  id: string;
  price: string;
  stock: number;
  productType: string;
};

type NewProductStorage = {
  id: string;
  productId: string;
  price: string;
};

function main() {
  console.log('🔍 Comparing prices between old and new JSON files...\n');

  let errors = 0;
  let warnings = 0;

  // 1. Compare Product prices
  console.log('📦 Comparing Product prices...');
  try {
    const oldProducts = loadJson<OldProduct[]>('Product.json', OLD_JSONS_DIR);
    const newProducts = loadJson<NewProduct[]>('Product (1).json', NEW_JSONS_DIR);

    const oldProductsMap = new Map(oldProducts.map((p) => [p.id, p]));
    const newProductsMap = new Map(newProducts.map((p) => [p.id, p]));

    for (const [id, oldP] of oldProductsMap) {
      const newP = newProductsMap.get(id);
      if (!newP) {
        console.warn(`⚠️  Product ${id} not found in new JSON`);
        warnings++;
        continue;
      }

      const oldPrice = parseFloat(oldP.price);
      const newPrice = parseFloat(newP.price);

      if (Math.abs(oldPrice - newPrice) > 0.01) {
        console.error(
          `❌ Product ${id}: Price mismatch - Old: ${oldPrice}, New: ${newPrice}`
        );
        errors++;
      }
    }

    console.log(`   ✓ Compared ${oldProducts.length} products\n`);
  } catch (e) {
    console.error(`   ❌ Error comparing products: ${(e as Error).message}\n`);
    errors++;
  }

  // 2. Compare ProductStorage prices
  console.log('📦 Comparing ProductStorage prices...');
  try {
    const oldStorages = loadJson<OldProductStorage[]>('ProductStorage.json', OLD_JSONS_DIR);
    const newStorages = loadJson<NewProductStorage[]>('ProductStorage (1).json', NEW_JSONS_DIR);

    const oldStoragesMap = new Map(oldStorages.map((s) => [s.id, s]));
    const newStoragesMap = new Map(newStorages.map((s) => [s.id, s]));

    for (const [id, oldS] of oldStoragesMap) {
      const newS = newStoragesMap.get(id);
      if (!newS) {
        console.warn(`⚠️  Storage ${id} not found in new JSON`);
        warnings++;
        continue;
      }

      const oldPrice = parseFloat(oldS.price);
      const newPrice = parseFloat(newS.price);

      if (Math.abs(oldPrice - newPrice) > 0.01) {
        console.error(
          `❌ Storage ${id} (productId: ${oldS.productId}): Price mismatch - Old: ${oldPrice}, New: ${newPrice}`
        );
        errors++;
      }
    }

    console.log(`   ✓ Compared ${oldStorages.length} storages\n`);
  } catch (e) {
    console.error(`   ❌ Error comparing storages: ${(e as Error).message}\n`);
    errors++;
  }

  // 3. Check ProductStorageUnit structure
  console.log('📦 Checking ProductStorageUnit structure...');
  try {
    const units = loadJson<any[]>('ProductStorageUnit.json', NEW_JSONS_DIR);
    const requiredFields = ['id', 'storageId', 'color', 'stock', 'taxStatus', 'taxType'];
    let unitErrors = 0;

    for (const unit of units) {
      for (const field of requiredFields) {
        if (!(field in unit)) {
          console.error(`❌ Unit ${unit.id || 'unknown'}: Missing field '${field}'`);
          unitErrors++;
        }
      }
    }

    if (unitErrors === 0) {
      console.log(`   ✓ All ${units.length} units have required fields\n`);
    } else {
      console.error(`   ❌ Found ${unitErrors} unit structure errors\n`);
      errors += unitErrors;
    }
  } catch (e) {
    console.error(`   ❌ Error checking units: ${(e as Error).message}\n`);
    errors++;
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (errors === 0 && warnings === 0) {
    console.log('✅ All prices match! Everything looks good.');
  } else {
    console.log(`⚠️  Found ${errors} errors and ${warnings} warnings.`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(errors > 0 ? 1 : 0);
}

main();
