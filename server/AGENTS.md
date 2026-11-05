# server/AGENTS.md

## Module Context

Bun 런타임의 AI API 프록시 서버. Anthropic/Gemini 호출 결과를 react-live용 코드로 정규화해 반환한다. 루트 규칙과 중복되는 내용은 다루지 않는다.

## Tech Stack & Constraints

- 런타임은 Bun (`Bun.serve`, `process.env`). 외부 HTTP 클라이언트 라이브러리 없이 전역 `fetch`만 사용한다.
- 단일 진입점 `index.ts`에서 라우팅(`/api/config`, `/api/generate`)과 프로바이더 호출을 모두 처리한다.

## Implementation Patterns

- 모든 응답에 `CORS_HEADERS`를 붙인다 (`index.ts:51`). 새 응답 경로를 추가할 때 누락하면 브라우저에서 실패한다.
- 순수 함수는 `generator.ts`, `fallback.ts`에 두고 `*.test.ts`를 같은 폴더에 둔다.

## Testing Strategy

- `bun run test` (루트에서 실행). 이 폴더 테스트도 vitest로 실행된다.
- 테스트 대상은 `generator.ts`, `fallback.ts`뿐이다. `index.ts`는 import 부수효과(서버 기동) 때문에 테스트 경계 밖이며, 로직을 추가하면 순수 모듈로 빼서 테스트한다.

## Local Golden Rules

- Asymmetry: Gemini에만 모델 폴백(`index.ts:134-136`, `withModelFallback`)과 `MAX_TOKENS` 잘림 검사(`index.ts:123-125`)가 있고, Anthropic 경로(`index.ts:68-96`)에는 없다. 한쪽에 보강한 처리는 다른 쪽에도 필요한지 먼저 판단하라.
- Security Boundary: Gemini URL은 API 키를 쿼리스트링에 포함한다 (`index.ts:99`). 이 URL을 로그, 에러 메시지, 응답에 노출하지 마라. 에러에는 상태 코드만 담는다 (`index.ts:112`).
- Double Defense: `render()` 호출 보장은 SYSTEM_PROMPT 규칙(`index.ts:12`)과 `ensureRenderCall`(`generator.ts:16`) 두 곳에서 한다. 하나만 남기지 마라.
- Do: `GOOGLE_MODELS` 순서는 우선순위다 (`index.ts:4-5`). 앞쪽이 먼저 시도되고 마지막 에러만 던져진다 (`fallback.ts`).
- Don't: 클라이언트 키(`apiKey`)가 서버 환경 키보다 우선한다 (`index.ts:65`). 이 순서를 바꾸지 마라.
