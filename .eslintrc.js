// A failing chai assertion whose actual value is a DOM element does not report a failure:
// web-test-runner times out after 120s, the file ends with 0 passed, and the tests that did
// pass in that file go with it. Measured in .mossy/parity/317-318/. The trigger is the actual
// value and not the matcher, so these selectors match the absence assertions whose actual
// comes from a DOM query, where the failing case always holds an element.
const DOM_QUERY = '/^(querySelector|closest)$/';
const EXPECT_DOM = `[object.object.object.callee.name="expect"][object.object.object.arguments.0.callee.property.name=${DOM_QUERY}]`;
const HANGS = 'hangs the runner instead of failing, because the actual value is a DOM element. Write expect(!!x).to.be.false instead.';

// eslint-config-airbnb-base owns no-restricted-syntax and options are replaced rather than
// merged, so its four entries are repeated here to keep them in force. The dependency is
// pinned at 15.0.0 in package.json, so this list cannot drift under us.
const airbnbRestrictedSyntax = [
  {
    selector: 'ForInStatement',
    message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
  },
  {
    selector: 'ForOfStatement',
    message: 'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
  },
  {
    selector: 'LabeledStatement',
    message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
  },
  {
    selector: 'WithStatement',
    message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
  },
];

module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
    'no-restricted-syntax': ['error',
      ...airbnbRestrictedSyntax,
      {
        selector: `MemberExpression[property.name="exist"][object.property.name="not"][object.object.property.name="to"]${EXPECT_DOM}`,
        message: `expect(el).to.not.exist ${HANGS}`,
      },
      {
        selector: `MemberExpression[property.name="null"][object.property.name="be"][object.object.property.name="to"]${EXPECT_DOM}`,
        message: `expect(el).to.be.null ${HANGS}`,
      },
      {
        selector: `CallExpression[callee.property.name="equal"][arguments.0.raw="null"][callee.object.property.name="to"][callee.object.object.callee.name="expect"][callee.object.object.arguments.0.callee.property.name=${DOM_QUERY}]`,
        message: `expect(el).to.equal(null) ${HANGS}`,
      },
    ],
  },
};
