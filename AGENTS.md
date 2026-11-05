# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun` 고정 (npm/yarn/pnpm 금지). 락 파일은 `bun.lock`.
- `bun install` — 의존성 설치
- `bun run dev` — API 서버(3002)와 Vite(5173) 동시 실행
- `bun run server` — API 서버만 실행 (`bun --watch`)
- `bun run test` — vitest 1회 실행 (`bun test` 아님: Bun 내장 러너가 아니라 vitest + jsdom 사용)
- `bun run lint` — ESLint
- `bun run build` — `tsc -b && vite build` (타입 검사 포함)
- 변경 후 완료 보고 전 `bun run test`, `bun run lint`, `bun run build` 통과를 확인한다.

## Golden Rules

### Immutable

- API 키를 클라이언트로 내려보내지 마라. `/api/config`는 키 존재 여부만 boolean으로 반환한다 (`server/index.ts:150-153`). 키 값 자체를 응답에 넣지 마라.
- API 키를 코드에 하드코딩하거나 로그로 출력하지 마라. 서버 키는 `process.env`에서만 읽는다 (`server/index.ts:59-62`). `.env`는 커밋 금지 (`.gitignore`).
- 서버가 생성 코드를 정규화하는 파이프라인 `ensureRenderCall(stripCodeFences(text))` (`server/index.ts:188`)을 우회하지 마라. 프론트엔드는 이미 정규화된 코드만 받는다고 가정한다.

### Hard Constraints

- 미리보기는 react-live `noInline` 모드다 (`src/components/LivePreview.tsx:10`). 생성 코드에 `render(<Component />)` 호출이 없으면 아무것도 그려지지 않는다. 이 모드를 바꾸면 `server/generator.ts`의 `ensureRenderCall`과 `SYSTEM_PROMPT`의 render 규칙(`server/index.ts:12`)을 함께 바꿔야 한다.
- 생성 코드는 import 없이 전역 `React`만 쓰는 순수 JS여야 한다 (`server/index.ts:11`, `:20`). SYSTEM_PROMPT를 수정할 때 이 제약을 지워서는 안 된다.
- 서버 에러 매핑은 에러 메시지 문자열에 `503`/`429`가 포함되는지로 판단한다 (`server/index.ts:194`, `:201`). 업스트림 에러 메시지 형식(`Claude API error: <status>`, `Gemini API error: <status>`, `:85`, `:112`)을 바꾸면 매핑이 깨진다.

### Do's & Don'ts

- Do: 프로바이더 호출 로직을 추가/수정할 때 `server/index.ts`의 에러 형식과 `src/types/index.ts`의 `Provider` 타입을 함께 갱신한다.
- Do: 순수 로직은 `server/generator.ts`, `server/fallback.ts`처럼 부수효과 없는 모듈로 분리해 단위 테스트를 붙인다. `server/index.ts`는 import 시 `Bun.serve`가 실행되므로 테스트에서 import하지 마라.
- Don't: 프론트엔드에서 AI API를 직접 호출하지 마라. 모든 호출은 `/api/generate` 프록시를 거친다 (`src/hooks/useComponentGenerator.ts:23`, `vite.config.ts` proxy).
- Don't: 서버 포트 3002를 한 곳만 바꾸지 마라. `server/index.ts:139`와 `vite.config.ts`의 proxy target이 함께 맞아야 한다.

## Project Context

- 프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기와 코드를 보여주는 도구.
- Stack: React 19, TypeScript, Vite, react-live, Bun(API 프록시), vitest, Anthropic/Gemini.

## Standards & References

- 소개와 실행 방법은 `README.md` 참고.
- 테스트는 `src/**/*.test.{ts,tsx}`, `server/**/*.test.ts`에 소스와 같은 위치에 둔다 (`vite.config.ts` include).
- 커밋: `<타입>: <한국어 요약>` (타입: feat, fix, refactor, chore). 요약은 50자 내외, 마침표 없음. 상세 절차는 `.claude/skills/commit/SKILL.md`.
- Maintenance Policy: 이 파일의 규칙과 코드가 어긋나는 것을 발견하면 수정 제안을 함께 보고한다.
