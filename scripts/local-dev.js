import 'dotenv/config';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const contentDir = path.join(rootDir, 'src', 'content');
const backupDir = path.join(rootDir, 'src', '.content_backup');

// Get local path from env
const localPath = process.env.LOCAL_CONTENT_PATH;

if (!localPath) {
    console.error('❌ LOCAL_CONTENT_PATH is not defined in .env');
    console.error('Please add LOCAL_CONTENT_PATH=/path/to/your/content to your .env file');
    process.exit(1);
}

// Helper to run commands
async function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: 'inherit', shell: true, cwd: rootDir });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
        });
    });
}

// Restores the original directory structure
async function restoreOriginal() {
    try {
        // 1. Remove the symlink if it exists
        const stats = await fs.lstat(contentDir).catch(() => null);
        if (stats && stats.isSymbolicLink()) {
            await fs.unlink(contentDir);
            console.log('✓ Unlinked symlink');
        }

        // 2. Restore backup if it exists
        const backupStats = await fs.access(backupDir).then(() => true).catch(() => false);
        if (backupStats) {
            await fs.rename(backupDir, contentDir);
            console.log('✓ Restored original src/content');
        }
    } catch (error) {
        console.error('⚠️ Error during cleanup:', error);
    }
}

async function main() {
    // Determine the target path absolute location
    // If localPath is relative, assume relative to project root
    const absInternalPath = path.resolve(rootDir, localPath);

    // Verify target exists
    try {
        await fs.access(absInternalPath);
        const stats = await fs.stat(absInternalPath);
        if (!stats.isDirectory()) {
            throw new Error('Not a directory');
        }
    } catch (e) {
        console.error(`❌ Target path does not exist or is not a directory: ${absInternalPath}`);
        process.exit(1);
    }

    console.log('🔄 Preparing local dev environment...');

    // 0. Cleanup any previous failed runs (restore from backup if needed)
    await restoreOriginal();

    // 1. Run content-clean (on the real src/content)
    console.log('🧹 Running clean-content...');
    try {
        await runCommand('node', ['scripts/clean-content.js']);
    } catch (e) {
        console.error('Failed to clean content:', e);
        process.exit(1);
    }

    // 2. Backup existing src/content
    const contentExists = await fs.access(contentDir).then(() => true).catch(() => false);
    if (contentExists) {
        await fs.rename(contentDir, backupDir);
        console.log('✓ Backed up src/content');
    }

    // 3. Create Symlink
    try {
        await fs.symlink(absInternalPath, contentDir, 'dir');
        console.log(`🔗 Symlinked src/content -> ${absInternalPath}`);
    } catch (e) {
        console.error('❌ Failed to create symlink:', e);
        await restoreOriginal();
        process.exit(1);
    }

    // 4. Start Dev Server
    console.log('🚀 Starting Astro Dev Server...');
    // Using 'astro dev' directly to skip 'sync' script
    // We assume 'astro' is available in node_modules/.bin, handled by npm script runner or usually npx/pnpm exec
    // Since we are running via 'node', we can use spawn with shell=true and 'pnpm astro dev' or just 'npx astro dev'
    const devParams = ['astro', 'dev'];

    // We'll trust the user has pnpm or we can just use npx
    const runner = 'npx';

    const devProc = spawn(runner, devParams, { stdio: 'inherit', shell: true, cwd: rootDir });

    // Handle termination
    let cleaned = false;
    const cleanupAndExit = async (code) => {
        if (cleaned) return;
        cleaned = true;
        console.log('\n🛑 Shutting down and cleaning up...');
        await restoreOriginal();
        process.exit(code || 0);
    };

    devProc.on('close', (code) => {
        cleanupAndExit(code);
    });

    process.on('SIGINT', async () => {
        devProc.kill();
        await cleanupAndExit(0);
    });

    process.on('SIGTERM', async () => {
        devProc.kill();
        await cleanupAndExit(0);
    });
}

main().catch(console.error);
