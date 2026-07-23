import { type Tree } from '@angular-devkit/schematics';

import { type LayoutComponentName, type LayoutShellInstallPlan } from './layout-shell.model';

export interface LayoutBaselineFile {
  readonly path: string;
  readonly content: string;
}

export interface LayoutBaselineFileSet {
  readonly component: LayoutComponentName;
  readonly directory: string;
  readonly files: readonly LayoutBaselineFile[];
}

export interface LayoutShellBaselineInspection {
  readonly creates: readonly string[];
  readonly updates: readonly string[];
  readonly deletes: readonly string[];
  readonly existing: readonly string[];
  readonly blockingNotes: readonly string[];
}

export const LAYOUT_MODEL_PATH = '/src/app/layout/layout.model.ts';
export const LAYOUT_CONFIG_PATH = '/src/app/layout/layout.config.ts';
export const APP_PATH = '/src/app/app.ts';
export const APP_TEMPLATE_PATH = '/src/app/app.html';
export const APP_SPEC_PATH = '/src/app/app.spec.ts';

export const APP_BASELINE_FILES: readonly LayoutBaselineFile[] = [
  {
    path: APP_PATH,
    content: `import { Component } from '@angular/core';
import { ShellComponent } from '@layout/shell/shell';

@Component({
  selector: 'app-root',
  imports: [ShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
`,
  },
  {
    path: APP_TEMPLATE_PATH,
    content: '<app-shell></app-shell>\n',
  },
];

export const APP_SPEC_BASELINE_FILE: LayoutBaselineFile = {
  path: APP_SPEC_PATH,
  content: `import { TestBed } from '@angular/core/testing';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-shell')).toBeTruthy();
  });
});
`,
};

export const LAYOUT_BASELINE_FILE_SETS: readonly LayoutBaselineFileSet[] = [
  {
    component: 'shell',
    directory: '/src/app/layout/shell',
    files: [
      {
        path: '/src/app/layout/shell/shell.ts',
        content: `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@layout/footer/footer';
import { HeaderComponent } from '@layout/header/header';
import { SidebarComponent } from '@layout/sidebar/sidebar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {}
`,
      },
      {
        path: '/src/app/layout/shell/shell.html',
        content: `<app-header></app-header>
<app-sidebar></app-sidebar>
<main>
  <router-outlet></router-outlet>
</main>
<app-footer></app-footer>
`,
      },
      {
        path: '/src/app/layout/shell/shell.scss',
        content: '',
      },
    ],
  },
  {
    component: 'header',
    directory: '/src/app/layout/header',
    files: [
      {
        path: '/src/app/layout/header/header.ts',
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {}
`,
      },
      {
        path: '/src/app/layout/header/header.html',
        content: '<header>Header</header>\n',
      },
      {
        path: '/src/app/layout/header/header.scss',
        content: '',
      },
    ],
  },
  {
    component: 'sidebar',
    directory: '/src/app/layout/sidebar',
    files: [
      {
        path: '/src/app/layout/sidebar/sidebar.ts',
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent {}
`,
      },
      {
        path: '/src/app/layout/sidebar/sidebar.html',
        content: '<aside>Sidebar</aside>\n',
      },
      {
        path: '/src/app/layout/sidebar/sidebar.scss',
        content: '',
      },
    ],
  },
  {
    component: 'footer',
    directory: '/src/app/layout/footer',
    files: [
      {
        path: '/src/app/layout/footer/footer.ts',
        content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {}
`,
      },
      {
        path: '/src/app/layout/footer/footer.html',
        content: '<footer>Footer</footer>\n',
      },
      {
        path: '/src/app/layout/footer/footer.scss',
        content: '',
      },
    ],
  },
];

export function inspectLayoutShellBaseline(
  tree: Tree,
  plan: LayoutShellInstallPlan,
): LayoutShellBaselineInspection {
  const creates: string[] = [];
  const updates: string[] = [];
  const deletes: string[] = [];
  const existing: string[] = [];
  const blockingNotes: string[] = [];

  if (plan.mode === 'content-only') {
    inspectContentOnlyAppFiles(tree, updates, blockingNotes);
  } else {
    inspectGeneratedTarget(tree, LAYOUT_MODEL_PATH, creates, existing, blockingNotes);
    inspectGeneratedTarget(tree, LAYOUT_CONFIG_PATH, creates, existing, blockingNotes);
  }

  for (const fileSet of LAYOUT_BASELINE_FILE_SETS) {
    inspectLayoutFileSet({
      tree,
      fileSet,
      selected: plan.components.includes(fileSet.component),
      creates,
      updates,
      deletes,
      existing,
      blockingNotes,
    });
  }

  return {
    creates,
    updates,
    deletes,
    existing,
    blockingNotes,
  };
}

function inspectContentOnlyAppFiles(tree: Tree, updates: string[], blockingNotes: string[]): void {
  for (const file of APP_BASELINE_FILES) {
    inspectRequiredBaselineFile(tree, file, updates, blockingNotes);
  }

  if (!tree.exists(APP_SPEC_BASELINE_FILE.path)) {
    return;
  }

  if (tree.readText(APP_SPEC_BASELINE_FILE.path) !== APP_SPEC_BASELINE_FILE.content) {
    blockingNotes.push(
      `${toDisplayPath(APP_SPEC_BASELINE_FILE.path)} differs from the supported starter baseline and cannot be updated safely.`,
    );
    return;
  }

  updates.push(APP_SPEC_BASELINE_FILE.path);
}

function inspectRequiredBaselineFile(
  tree: Tree,
  file: LayoutBaselineFile,
  updates: string[],
  blockingNotes: string[],
): void {
  if (!tree.exists(file.path)) {
    blockingNotes.push(`${toDisplayPath(file.path)} is required for content-only conversion.`);
    return;
  }

  if (tree.readText(file.path) !== file.content) {
    blockingNotes.push(
      `${toDisplayPath(file.path)} differs from the supported starter baseline and cannot be updated safely.`,
    );
    return;
  }

  updates.push(file.path);
}

function inspectGeneratedTarget(
  tree: Tree,
  path: string,
  creates: string[],
  existing: string[],
  blockingNotes: string[],
): void {
  if (!tree.exists(path)) {
    creates.push(path);
    return;
  }

  existing.push(path);
  blockingNotes.push(`${toDisplayPath(path)} already exists and will not be overwritten.`);
}

interface InspectLayoutFileSetOptions {
  readonly tree: Tree;
  readonly fileSet: LayoutBaselineFileSet;
  readonly selected: boolean;
  readonly creates: string[];
  readonly updates: string[];
  readonly deletes: string[];
  readonly existing: string[];
  readonly blockingNotes: string[];
}

function inspectLayoutFileSet({
  tree,
  fileSet,
  selected,
  creates,
  updates,
  deletes,
  existing,
  blockingNotes,
}: InspectLayoutFileSetOptions): void {
  const expectedPaths = new Set(fileSet.files.map((file) => file.path));
  const existingPaths = fileSet.files
    .filter((file) => tree.exists(file.path))
    .map((file) => file.path);
  const missingPaths = fileSet.files
    .filter((file) => !tree.exists(file.path))
    .map((file) => file.path);
  const customPaths = fileSet.files
    .filter((file) => tree.exists(file.path) && tree.readText(file.path) !== file.content)
    .map((file) => file.path);
  const extraPaths = getFilesInDirectory(tree, fileSet.directory).filter(
    (path) => path.startsWith(`${fileSet.directory}/`) && !expectedPaths.has(path),
  );

  existing.push(...customPaths, ...extraPaths);

  if (customPaths.length > 0) {
    blockingNotes.push(
      `${formatComponentLabel(fileSet.component)} contains customized baseline files: ${customPaths.map(toDisplayPath).join(', ')}.`,
    );
  }

  if (extraPaths.length > 0) {
    blockingNotes.push(
      `${formatComponentLabel(fileSet.component)} contains additional files that require manual review: ${extraPaths.map(toDisplayPath).join(', ')}.`,
    );
  }

  if (
    existingPaths.length > 0 &&
    missingPaths.length > 0 &&
    customPaths.length === 0 &&
    extraPaths.length === 0
  ) {
    blockingNotes.push(
      `${formatComponentLabel(fileSet.component)} is only partially present. Existing: ${existingPaths.map(toDisplayPath).join(', ')}. Missing: ${missingPaths.map(toDisplayPath).join(', ')}.`,
    );
  }

  if (customPaths.length > 0 || extraPaths.length > 0) {
    return;
  }

  if (selected) {
    if (missingPaths.length === fileSet.files.length) {
      creates.push(...missingPaths);
    } else if (missingPaths.length === 0) {
      updates.push(...existingPaths);
    }

    return;
  }

  if (missingPaths.length === 0) {
    deletes.push(...existingPaths);
  }
}

function formatComponentLabel(component: LayoutComponentName): string {
  return component.replace(/^./, (firstLetter) => firstLetter.toUpperCase());
}

function getFilesInDirectory(tree: Tree, directory: string): string[] {
  const paths: string[] = [];

  tree.getDir(directory).visit((path) => {
    paths.push(path);
  });

  return paths;
}

function toDisplayPath(path: string): string {
  return path.replace(/^\//, '');
}
