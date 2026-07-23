import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { createCliHelp, parseCliArgs } from './starter-evolution-cli.mjs';

const manifest = JSON.parse(
  readFileSync(new URL('./evolution/evolution-manifest.json', import.meta.url), 'utf8'),
);

describe('Evolution CLI arguments', () => {
  it('parses global and evolution options from the manifest', () => {
    expect(
      parseCliArgs(
        [
          '--name=signal-store',
          '--preview',
          '--store-scope',
          'root',
          '--store-name=session',
          '--yes',
        ],
        manifest,
      ),
    ).toEqual({
      name: 'signal-store',
      preview: true,
      storeScope: 'root',
      storeName: 'session',
      yes: true,
    });
  });

  it('parses configurable Transloco languages and default language', () => {
    expect(
      parseCliArgs(
        [
          '--name',
          'transloco',
          '--transloco-languages',
          'en,it,fr',
          '--transloco-default-language=fr',
          '--preview',
        ],
        manifest,
      ),
    ).toEqual({
      name: 'transloco',
      translocoLanguages: 'en,it,fr',
      translocoDefaultLanguage: 'fr',
      preview: true,
    });
  });

  it('parses configurable Layout Shell options', () => {
    expect(
      parseCliArgs(
        [
          '--name',
          'layout-shell',
          '--layout-mode',
          'select',
          '--layout-components=shell,header,sidebar',
          '--layout-header-behavior',
          'sticky',
          '--layout-sidebar-mode=collapsible',
          '--layout-sidebar-position',
          'end',
          '--layout-sidebar-initial-state=collapsed',
          '--layout-content-width',
          'contained',
          '--preview',
        ],
        manifest,
      ),
    ).toEqual({
      name: 'layout-shell',
      layoutMode: 'select',
      layoutComponents: 'shell,header,sidebar',
      layoutHeaderBehavior: 'sticky',
      layoutSidebarMode: 'collapsible',
      layoutSidebarPosition: 'end',
      layoutSidebarInitialState: 'collapsed',
      layoutContentWidth: 'contained',
      preview: true,
    });
  });

  it('rejects options without values and conflicting execution modes', () => {
    expect(() => parseCliArgs(['--name'], manifest)).toThrow('Option --name requires a value.');
    expect(() => parseCliArgs(['--name', 'transloco', '--preview', '--apply'], manifest)).toThrow(
      'Options --preview and --apply cannot be used together.',
    );
  });

  it('rejects evolution options without a matching evolution name', () => {
    expect(() => parseCliArgs(['--store-scope', 'root'], manifest)).toThrow(
      'Evolution-specific options require --name <evolution>.',
    );
    expect(() =>
      parseCliArgs(['--name', 'bootstrap', '--tailwind-mode', 'select'], manifest),
    ).toThrow('Option --tailwind-mode belongs to evolution "tailwind", not "bootstrap".');
  });

  it('rejects repeated, unsupported and positional arguments', () => {
    expect(() =>
      parseCliArgs(['--name', 'transloco', '--name', 'runtime-config'], manifest),
    ).toThrow('Option --name was provided more than once.');
    expect(() => parseCliArgs(['--unknown'], manifest)).toThrow('Unsupported argument: --unknown');
    expect(() => parseCliArgs(['transloco'], manifest)).toThrow(
      'Unsupported positional argument: transloco',
    );
  });

  it('generates complete and evolution-specific help from the manifest', () => {
    const completeHelp = createCliHelp(manifest, '0.9.0-alpha.0');
    const aiHelp = createCliHelp(manifest, '0.9.0-alpha.0', 'ai-genkit');

    expect(completeHelp).toContain('Available evolutions:');
    expect(completeHelp).toContain('--store-scope <feature|root>');
    expect(completeHelp).toContain('--transloco-languages <en|it|es|fr|de|pt|nl|zh|ja|ko|ar|hi>');
    expect(completeHelp).toContain(
      '--transloco-default-language <en|it|es|fr|de|pt|nl|zh|ja|ko|ar|hi>',
    );
    expect(completeHelp).toContain('--bootstrap-components <alert|badge|button|card|input>');
    expect(completeHelp).toContain('--layout-mode <all|select|content-only>');
    expect(completeHelp).toContain('--layout-components <shell|header|sidebar|footer>');
    expect(completeHelp).toContain('--layout-sidebar-mode <persistent|collapsible>');
    expect(aiHelp).toContain('Selected evolution:');
    expect(aiHelp).toContain('--ai-model <value>');
    expect(aiHelp).not.toContain('--store-scope');
  });
});
