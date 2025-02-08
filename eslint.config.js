import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import compat from 'eslint-plugin-compat';
import cypressPlugin from 'eslint-plugin-cypress';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import vitestPlugin from 'eslint-plugin-vitest';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', 'dist/**'], // 구성 개체가 적용되지 않아야 하는 파일을 나타내는 glob패턴, 지정하지 않으면 모든 파일에 적용
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // 구성 개체가 적용되어야 하는 피일을 나타는 glob패턴, 지정하지 않으면 모든 파일에 적용
    languageOptions: {
      ecmaVersion: 'latest', // 지원할 ECMAScript 버전 기본 값은 'latest'
      sourceType: 'module', // js 소스코드의 유형, ECMAScript의 모듈일 경우 'module', Commonjs인 경우 'commonjs'
      globals: {
        // linting 중 전역 범위에 추가되어야하는 추가 개체를 지정
        ...globals.browser,
        ...globals.es2021,
        Set: true,
        Map: true,
      },
      parser: typescriptParser, // parse() 또는 parseForESLint() 메서드를 포함하는 객체, 기본 값은 'espree', 추가적으로 레거시 프로젝트에서는 babel로 되어있는 parser일 수 있음
      parserOptions: {
        // parse() 또는 parseForESLint() 메서드에 직접 전달되는 추가 옵션을 지정
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: '.',
      },
    },
    plugins: {
      // 플러그인 개체를 매핑
      prettier: eslintPluginPrettier,
      react,
      'react-hooks': reactHooks,
      '@typescript-eslint': typescript,
      compat,
      import: importPlugin,
      storybook: storybookPlugin,
    },
    settings: {
      // 모든 규칙에 사용할 수 있는 정보의 key-value 쌍이 포함된 객체
      react: {
        version: 'detect',
      },
      browsers: '> 0.5%, last 2 versions, not op_mini all, Firefox ESR, not dead',
    },
    rules: {
      // 구성된 규칙이 포함된 객체, files가 지정되면 포함된 파일만 검사
      // Prettier 통합 규칙
      'prettier/prettier': 'error', // Prettier 포맷팅 오류를 ESLint 에러로 표시
      'comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
        },
      ],
      // React 관련 규칙
      'react/prop-types': 'off', // TypeScript 사용 시 prop-types 검사를 비활성화
      'react/react-in-jsx-scope': 'off', // React 17+에서는 필요 없음
      'react-hooks/rules-of-hooks': 'error', // 훅 사용 시 규칙 강제
      'react-hooks/exhaustive-deps': 'warn', // useEffect 의존성 배열 검증

      // TypeScript 관련 규칙
      '@typescript-eslint/no-explicit-any': 'warn', // any 사용 최소화
      // '@typescript-eslint/no-unused-vars': [
      //   'warn',
      //   { argsIgnorePattern: '^_' }, // 사용하지 않는 변수 중 '_'로 시작하는 인자는 무시
      // ],

      // 최신 JavaScript 스타일 규칙
      // 'prefer-const': 'error', // 가능하면 const 사용
      'no-var': 'error', // var 사용 금지
      'arrow-body-style': ['error', 'as-needed'], // 필요할 때만 중괄호 사용
      'object-shorthand': 'error', // 객체 속성 단축 표기법 사용
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }], // 빈 줄 제한

      // 코드 안전성 및 문제 방지
      eqeqeq: ['error', 'always'], // 항상 === 사용
      'no-console': ['warn', { allow: ['warn', 'error'] }], // console.log는 경고
      'no-debugger': 'warn', // 디버거 사용 경고
      'no-unused-vars': 'warn', // TypeScript 규칙으로 대체
      'no-undef': 'off', // TypeScript 환경에서 처리

      // 브라우저 호환성 (Compat) 규칙
      'compat/compat': 'warn', // 호환성 검사

      // import 순서 규칙 추가
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', ['parent', 'sibling'], 'index'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],

      // import 확장자 규칙만 비활성화
      'import/extensions': 'off',
    },
  },
  // 테스트 파일 설정
  {
    files: [
      '**/src/**/*.{spec,test}.[jt]s?(x)',
      '**/__mocks__/**/*.[jt]s?(x)',
      './src/setupTests.ts',
    ],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      'vitest/expect-expect': 'off',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        globalThis: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
        vi: true,
      },
    },
  },
  // Cypress 테스트 파일 설정
  {
    files: ['cypress/e2e/**/*.cy.js'],
    plugins: {
      cypress: cypressPlugin,
    },
    languageOptions: {
      globals: {
        cy: true,
      },
    },
  },
  prettier, // Prettier 충돌 방지
];
