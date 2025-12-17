import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const contentDir = path.join(rootDir, 'src', 'content');

// Directories to clean (matching sync-content.js mappings)
const targets = ['blog', 'works', 'icons', 'links'];

async function cleanContent() {
    console.log('🧹 Cleaning synced content directories...');

    for (const target of targets) {
        const targetPath = path.join(contentDir, target);
        try {
            // Check if directory exists
            await fs.access(targetPath);

            // Remove directory and its contents
            await fs.rm(targetPath, { recursive: true, force: true });
            console.log(`✓ Removed: ${target}`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`- Skipped: ${target} (not found)`);
            } else {
                console.error(`✗ Failed to remove ${target}:`, error.message);
            }
        }
    }

    console.log('\n✨ Content clean complete!');
}

cleanContent().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
