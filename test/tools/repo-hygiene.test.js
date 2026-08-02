/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';

/*
 * Three leftovers from the aem-boilerplate scaffold, asserted here because
 * nothing else in the tree reads these files. (#126)
 *
 * The scaffold shipped a one-shot workflow, .github/workflows/cleanup-on-create.yaml,
 * whose job was to delete the template's own helper files and substitute {repo}
 * and {owner} in README.md, AGENTS.md and the pull request template on the first
 * push to main. It never ran here: the placeholders are still in two of those
 * three files, and the workflow is still callable by hand with contents: write.
 *
 * .hlxignore is the third. It is the pipeline's exclude list, so an entry naming
 * a file the repo does not have is inert, and inert is exactly why it survives
 * a rename. karma.config.js has never existed in this tree; the runner is wtr.
 */

/** The site these URLs address, which is what the scaffold would have substituted. */
const SITE = 'main--contitires--cloudadoption';

/** The scaffold's own two tokens. `{branch}` and `{path}` are per-PR and stay. */
const PLACEHOLDERS = /\{repo\}|\{owner\}/;

/**
 * The workflows this repo ships, and the scaffold one-shot that must not come
 * back. A served file is asserted, a 404 is skipped, so this reads as a guard
 * once the one-shot is gone.
 */
const WORKFLOWS = ['main.yaml', 'cleanup-on-create.yaml'];

/** The body of a served path, or null where the repo does not ship it. */
async function read(path) {
  const res = await fetch(path);
  return res.ok ? res.text() : null;
}

describe('repo hygiene, the scaffold leftovers', () => {
  it('ships no hand-triggerable workflow that deletes files and pushes', async () => {
    const served = (await Promise.all(WORKFLOWS.map(async (name) => {
      const body = await read(`/.github/workflows/${name}`);
      return body === null ? null : { name, body };
    }))).filter(Boolean);

    expect(served.length, 'at least one workflow was read').to.be.greaterThan(0);
    served.forEach(({ name, body }) => {
      if (!body.includes('workflow_dispatch')) return;
      expect(/rm -rf/.test(body), `${name} removes files on a manual trigger`).to.be.false;
      expect(/git push/.test(body), `${name} pushes on a manual trigger`).to.be.false;
    });
  });

  it('names only files this repo ships in .hlxignore', async () => {
    const body = await read('/.hlxignore');
    expect(body, '.hlxignore is served').to.be.a('string');
    // gitignore syntax: a line with no `*` and no trailing `/` names one file
    const named = body.split('\n').map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && !line.includes('*') && !line.endsWith('/'));
    expect(named.length, '.hlxignore names at least one file').to.be.greaterThan(0);
    const missing = (await Promise.all(named.map(async (name) => {
      const res = await fetch(`/${name}`);
      return res.ok ? null : name;
    }))).filter(Boolean);
    expect(missing, 'every named file is in the tree').to.eql([]);
  });

  it('addresses this site in AGENTS.md rather than the scaffold placeholders', async () => {
    const body = await read('/AGENTS.md');
    expect(body, 'AGENTS.md is served').to.be.a('string');
    expect(PLACEHOLDERS.test(body), 'AGENTS.md carries {repo} or {owner}').to.be.false;
    expect(body.includes(SITE), `AGENTS.md names ${SITE}`).to.be.true;
  });

  it('addresses this site in the pull request template', async () => {
    const body = await read('/.github/pull_request_template.md');
    expect(body, 'the template is served').to.be.a('string');
    expect(PLACEHOLDERS.test(body), 'the template carries {repo} or {owner}').to.be.false;
    expect(body.includes(SITE), `the template names ${SITE}`).to.be.true;
  });
});
