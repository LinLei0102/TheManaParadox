import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = fileURLToPath(new URL('.', import.meta.url));
const dictionary = JSON.parse(fs.readFileSync(new URL('./dictionary.json', import.meta.url), 'utf8'));
const runtime = fs.readFileSync(new URL('./runtime.js', import.meta.url), 'utf8');

/** Replace only exact, curated string literals. Never touches identifiers or property names. */
function translateBundle(source) {
  const sf = ts.createSourceFile('bundle.js', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  const edits = [];

  function replacement(text) {
    const zh = dictionary[text];
    if (!zh || zh === text) return undefined;
    return zh;
  }

  function visit(node) {
    if (ts.isStringLiteral(node)) {
      // Never translate property names / import specifiers / enum keys.
      const parent = node.parent;
      const isName = parent && (
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isPropertySignature(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node) ||
        (ts.isImportSpecifier(parent) && parent.propertyName === node) ||
        (ts.isExportSpecifier(parent) && parent.propertyName === node) ||
        (ts.isBindingElement(parent) && parent.propertyName === node) ||
        (ts.isEnumMember(parent) && parent.name === node) ||
        (ts.isMethodDeclaration(parent) && parent.name === node)
      );
      if (!isName) {
        const zh = replacement(node.text);
        if (zh !== undefined) edits.push({ start: node.getStart(sf), end: node.getEnd(), text: JSON.stringify(zh) });
      }
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
      const zh = replacement(node.text);
      if (zh !== undefined) {
        const inner = zh.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
        edits.push({ start: node.getStart(sf), end: node.getEnd(), text: '`' + inner + '`' });
      }
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const zh = replacement(node.text);
      if (zh !== undefined) {
        const inner = zh.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
        const isTail = ts.isTemplateTail(node);
        // Only the quasi text is replaced; the `${` / `}` / backtick delimiters stay intact.
        const innerStart = node.getStart(sf) + 1;
        const innerEnd = isTail ? node.getEnd() - 1 : node.getEnd() - 2;
        edits.push({ start: innerStart, end: innerEnd, text: inner });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  // Deduplicate overlapping edits (keep the first), apply from the end.
  edits.sort((a, b) => b.start - a.start);
  let lastEnd = Infinity;
  let result = source;
  for (const e of edits) {
    if (e.end > lastEnd) continue;
    result = result.slice(0, e.start) + e.text + result.slice(e.end);
    lastEnd = e.start;
  }
  return result;
}

export class I18nPlugin {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
  }

  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.compilation.tap('I18nPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'I18nPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING },
        () => {
          if (!this.enabled) return;
          const asset = compilation.getAsset('bundle.js');
          if (!asset) return;
          const original = asset.source.source().toString();
          const translated = translateBundle(original);
          const final = runtime + '\n' + translated;
          compilation.updateAsset('bundle.js', new sources.RawSource(final));
          compilation.getLogger('I18nPlugin').info(
            `Applied ${Object.keys(dictionary).length} termbase-approved translations`,
          );
        },
      );
    });
  }
}
