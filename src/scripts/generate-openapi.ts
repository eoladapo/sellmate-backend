/**
 * Script to generate OpenAPI specification JSON file
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/generate-openapi.ts
 */
import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger.config';

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'swagger');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'openapi.json');

async function generateOpenAPISpec(): Promise<void> {
  console.log('🚀 Generating OpenAPI specification...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  // Write the OpenAPI spec to file
  const specJson = JSON.stringify(swaggerSpec, null, 2);
  fs.writeFileSync(OUTPUT_FILE, specJson, 'utf-8');

  console.log(`✅ OpenAPI specification generated successfully!`);
  console.log(`📄 Output file: ${OUTPUT_FILE}`);
  console.log(`📊 File size: ${(Buffer.byteLength(specJson, 'utf-8') / 1024).toFixed(2)} KB\n`);

  // Print summary of documented endpoints
  const spec = swaggerSpec as {
    paths?: Record<string, Record<string, unknown>>;
    tags?: Array<{ name: string }>;
    components?: {
      schemas?: Record<string, unknown>;
    };
  };

  if (spec.paths) {
    const pathCount = Object.keys(spec.paths).length;
    let endpointCount = 0;

    for (const pathMethods of Object.values(spec.paths)) {
      endpointCount += Object.keys(pathMethods).filter(
        (method) => ['get', 'post', 'put', 'delete', 'patch'].includes(method)
      ).length;
    }

    console.log('📈 API Documentation Summary:');
    console.log(`   - Paths: ${pathCount}`);
    console.log(`   - Endpoints: ${endpointCount}`);
    console.log(`   - Tags: ${spec.tags?.length || 0}`);
    console.log(`   - Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
  }

  console.log('\n🌐 Swagger UI will be available at: /api/v1/docs');
  console.log('📋 OpenAPI JSON will be available at: /api/v1/docs.json');
}

generateOpenAPISpec().catch((error) => {
  console.error('❌ Error generating OpenAPI specification:', error);
  process.exit(1);
});
