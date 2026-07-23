import { HostTree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { installDesignSystemComponents } from './design-system.installer';
import { type DesignSystemComponentDefinition } from './design-system.model';
import { getDesignSystemComponentStatuses } from './design-system.plan';

const component: DesignSystemComponentDefinition<'button'> = {
  name: 'button',
  label: 'Button',
  className: 'ExampleButton',
  exportPath: './button/button',
  files: [
    { path: '/button/button.ts', content: 'export class ExampleButton {}\n' },
    { path: '/button/button.html', content: '<button>Example</button>\n' },
  ],
  supplementalFiles: [
    { path: '/button/button.spec.ts', content: "describe('ExampleButton', () => {});\n" },
  ],
};

const plan = { mode: 'select', components: [component] } as const;

describe('design-system component installation', () => {
  it('does not add supplemental files to an existing user-owned component', () => {
    const tree = new HostTree();
    tree.create('/button/button.ts', 'custom button source\n');
    tree.create('/button/button.html', '<button>Custom</button>\n');

    installDesignSystemComponents({ tree, plan, displayName: 'Example' });

    expect(tree.readText('/button/button.ts')).toBe('custom button source\n');
    expect(tree.readText('/button/button.html')).toBe('<button>Custom</button>\n');
    expect(tree.exists('/button/button.spec.ts')).toBe(false);
  });

  it('creates required and supplemental files for a new component', () => {
    const tree = new HostTree();

    installDesignSystemComponents({ tree, plan, displayName: 'Example' });

    expect(tree.readText('/button/button.ts')).toContain('ExampleButton');
    expect(tree.readText('/button/button.html')).toContain('Example');
    expect(tree.readText('/button/button.spec.ts')).toContain("describe('ExampleButton'");
  });

  it('treats a supplemental-only component as partially installed', () => {
    const tree = new HostTree();
    tree.create('/button/button.spec.ts', 'custom test\n');

    const [status] = getDesignSystemComponentStatuses((path) => tree.exists(path), plan);

    expect(status?.status).toBe('partial');
    expect(status?.existingSupplementalFiles).toEqual(component.supplementalFiles);
    expect(status?.missingRequiredFiles).toEqual(component.files);
  });

  it('still blocks incomplete required component sources', () => {
    const tree = new HostTree();
    tree.create('/button/button.ts', 'custom button source\n');

    expect(() => installDesignSystemComponents({ tree, plan, displayName: 'Example' })).toThrow(
      'Example component installation is incomplete',
    );

    expect(tree.exists('/button/button.html')).toBe(false);
    expect(tree.exists('/button/button.spec.ts')).toBe(false);
  });
});
