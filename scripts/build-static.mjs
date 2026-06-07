// Build script that inlines shared CSS and JS modules into a tool's output.
// Resolves @import in CSS and import in JS, producing self-contained files
// that can be deployed to static hosting without access to a parent directory.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const root = process.cwd();
const sharedRoot = resolve(root, '..', 'shared');

// Two modes:
// 1. Bundle mode (local dev with parent repo): shared/ is accessible, bundle everything.
// 2. Verify mode (Vercel deploy of submodule): shared/ is not accessible, just verify
//    the committed bundle has no broken shared references.
const bundleMode = existsSync(sharedRoot);
if (!bundleMode) {
  console.log('shared/ not accessible - running in verify-only mode');
}

function readShared(relativePath) {
  return readFileSync(join(sharedRoot, relativePath), 'utf8');
}

function resolveImport(fromFile, importPath) {
  // Try the path as-is first (with .js or .mjs already)
  const directTargets = [
    resolve(dirname(fromFile), importPath),
    resolve(dirname(fromFile), `${importPath}.mjs`),
    resolve(dirname(fromFile), `${importPath}.js`)
  ];
  for (const target of directTargets) {
    if (existsSync(target)) return target;
  }
  let cleanPath = importPath.replace(/\.(mjs|js)$/, '');
  let candidates = [cleanPath];
  if (!cleanPath.endsWith('/index')) {
    candidates.push(`${cleanPath}/index`);
  }
  for (const candidate of candidates) {
    for (const ext of ['.mjs', '.js']) {
      const target = resolve(dirname(fromFile), `${candidate}${ext}`);
      if (existsSync(target)) return target;
    }
  }
  return null;
}

function collectJsImports(source, fromFile, collected = new Set()) {
  const importRegex = /import\s+(?:[\s\S]+?from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(source)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('node:') || importPath.startsWith('http')) continue;
    if (importPath.startsWith('.')) {
      const resolved = resolveImport(fromFile, importPath);
      if (resolved && !collected.has(resolved)) {
        collected.add(resolved);
        const subSource = readFileSync(resolved, 'utf8');
        collectJsImports(subSource, resolved, collected);
      }
    }
  }
  return collected;
}

function parseImports(source) {
  // Returns array of {full, names, source}
  const importRegex = /import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]\s*;?/g;
  const imports = [];
  let match;
  while ((match = importRegex.exec(source)) !== null) {
    const clause = match[1].trim();
    const sourcePath = match[2];
    let names;
    if (clause.startsWith('{')) {
      const namesStr = clause.slice(1, -1);
      names = namesStr.split(',').map((n) => {
        const parts = n.trim().split(/\s+as\s+/);
        return { imported: parts[0], local: parts[1] || parts[0] };
      });
    } else if (clause.startsWith('*')) {
      const m = clause.match(/\*\s+as\s+(\w+)/);
      names = [{ namespace: m ? m[1] : '_ns' }];
    } else {
      names = [{ default: clause }];
    }
    imports.push({ full: match[0], names, source: sourcePath });
  }
  return imports;
}

function bundleJs(entryFile, outputFile) {
  const entrySource = readFileSync(entryFile, 'utf8');
  const allFiles = [entryFile, ...collectJsImports(entrySource, entryFile)];

  // Map file path -> { body (with imports stripped), exports (set of names) }
  const modules = new Map();

  for (const file of allFiles) {
    let source = readFileSync(file, 'utf8');
    source = source.replace(/^import\s+[^;]+;\s*$/gm, '');
    // Collect exports
    const exportNames = new Set();
    const exportRegex = /^export\s+(?:const|let|var|function|class|async\s+function)\s+(\w+)/gm;
    let m;
    while ((m = exportRegex.exec(source)) !== null) {
      exportNames.add(m[1]);
    }
    const defaultMatch = source.match(/^export\s+default\s+/m);
    if (defaultMatch) exportNames.add('default');
    // Remove `export` keyword from declarations (we'll re-export via IIFE return)
    source = source.replace(/^export\s+(?=(const|let|var|function|class|async\s+function|default\s+))/gm, '');
    // Remove `export { ... };` clauses
    source = source.replace(/^export\s*\{[^}]*\};\s*$/gm, '');
    modules.set(file, { body: source, exports: exportNames });
  }

  // For each non-entry module, wrap in IIFE that returns the exports.
  // The entry module stays unwrapped.
  const bundled = [];
  const moduleVarNames = new Map();

  // First, build the bundled output. Entry first, then dependencies in order.
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const mod = modules.get(file);
    const isEntry = i === 0;

    // Determine the variable name for this module (for non-entry modules)
    const varName = isEntry
      ? null
      : `__m${i}_${file.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}`;

    if (!isEntry) {
      moduleVarNames.set(file, varName);
      const exportList = [...mod.exports].join(', ');
      // Wrap in IIFE: const __m1 = (() => { ... return { exports... }; })();
      const wrapped = `const ${varName} = (() => {\n${mod.body}\nreturn { ${exportList} };\n})();`;
      const rel = relative(root, file);
      bundled.push(`// ===== ${rel} =====\n${wrapped}\n`);
    } else {
      // Entry: replace import statements with references to module vars
      let body = mod.body;
      const imports = parseImports(readFileSync(file, 'utf8'));
      for (const imp of imports) {
        const resolvedFile = resolveImport(file, imp.source);
        const modVar = moduleVarNames.get(resolvedFile);
        if (!modVar) continue;
        if (imp.names[0]?.namespace) {
          body = body.replace(imp.full, `const ${imp.names[0].namespace} = ${modVar};`);
        } else {
          const destructures = imp.names
            .map((n) => {
              if (n.default) return `default: ${n.default}`;
              return `${n.imported} as ${n.local}`;
            })
            .join(', ');
          body = body.replace(imp.full, `const { ${destructures} } = ${modVar};`);
        }
      }
      const rel = relative(root, file);
      bundled.push(`// ===== ${rel} =====\n${body}\n`);
    }
  }

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, bundled.join('\n'));
  console.log(`  Bundled ${allFiles.length} JS files -> ${relative(root, outputFile)}`);
}

function bundleCss(entryFile, outputFile) {
  const seen = new Set();
  const parts = [];

  function process(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    const importRegex = /@import\s+url\(['"]?([^'")]+)['"]?\)\s*;?/g;
    let lastIndex = 0;
    let match;
    const localParts = [];
    while ((match = importRegex.exec(source)) !== null) {
      localParts.push(source.slice(lastIndex, match.index));
      const importPath = match[1];
      const resolved = resolve(dirname(file), importPath);
      if (existsSync(resolved)) {
        process(resolved);
      } else {
        console.error(`  CSS import not found: ${importPath} from ${file}`);
      }
      lastIndex = importRegex.lastIndex;
    }
    localParts.push(source.slice(lastIndex));
    const combined = localParts.join('').trim();
    if (combined) {
      const rel = relative(root, file);
      parts.push(`/* ===== ${rel} ===== */\n${combined}\n`);
    }
  }

  process(entryFile);
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, parts.join('\n'));
  console.log(`  Bundled ${seen.size} CSS sections -> ${relative(root, outputFile)}`);
}

const mode = process.argv[2] || 'all';

if (bundleMode) {
  if (mode === 'css' || mode === 'all') {
    const cssEntry = resolve(root, 'styles.css');
    if (existsSync(cssEntry)) {
      console.log('Building CSS bundle...');
      bundleCss(cssEntry, cssEntry);
    }
  }

  if (mode === 'js' || mode === 'all') {
    const srcDir = resolve(root, 'src');
    if (existsSync(srcDir)) {
      const entries = ['app.js'];
      for (const entry of entries) {
        const entryFile = resolve(srcDir, entry);
        if (existsSync(entryFile)) {
          console.log(`Building JS bundle for ${entry}...`);
          bundleJs(entryFile, entryFile);
        }
      }
    }
  }

  console.log('Build complete (bundled output committed)');
} else {
  // Verify mode: check that the committed bundle has no broken shared references
  let ok = true;
  const cssFile = resolve(root, 'styles.css');
  const jsFile = resolve(root, 'src/app.js');

  if (existsSync(cssFile)) {
    const css = readFileSync(cssFile, 'utf8');
    if (/@import\s+url\(\s*['"]?\.\.\/shared/i.test(css)) {
      console.error('ERROR: styles.css has un-inlined @import url("../shared/...") reference');
      ok = false;
    } else {
      console.log('OK: styles.css has no un-inlined shared imports');
    }
  }

  if (existsSync(jsFile)) {
    const js = readFileSync(jsFile, 'utf8');
    if (/from\s+['"]\.\.\/\.\.\/shared/i.test(js)) {
      console.error('ERROR: src/app.js has un-inlined ../../shared/... import');
      ok = false;
    } else {
      console.log('OK: src/app.js has no un-inlined shared imports');
    }
  }

  if (!ok) process.exit(1);
  console.log('Build complete (verified committed bundle)');
}
