---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 프로젝트 언어에 맞는 템플릿(한국어/영문)으로 GitHub Pull Request를 생성한다. "PR 만들어줘", "PR 생성", "풀리퀘스트", "create pr", "open a pull request" 같은 요청에 활성화한다.
context: fork
allowed-tools: Bash, Read, Grep, Glob
---

# create-pr

현재 브랜치를 base 브랜치로 향하는 Pull Request로 생성하는 스킬. 서브 에이전트(fork)에서 실행된다.

## 템플릿 선택

PR 본문은 `references/` 의 템플릿 중 하나를 사용한다.

| 템플릿 | 파일 | 사용 조건 |
|--------|------|-----------|
| 한국어 | `references/pr-template-ko.md` | 한국어 프로젝트 (**이 프로젝트의 기본값**) |
| 영문 | `references/pr-template-en.md` | 해외 오픈소스 등 영어를 쓰는 프로젝트 |

선택 기준 (위에서부터 먼저 해당하는 것을 따른다):

1. 사용자가 언어를 명시하면 그대로 따른다.
2. 저장소에 `.github/pull_request_template.md` 가 있으면 그 파일 구조를 우선 사용하고, 언어는 아래 3~4를 따른다.
3. `git log -10` 의 커밋 메시지와 `README.md` 가 한국어이면 한국어, 영어이면 영문 템플릿을 쓴다.
4. 판단이 모호하면 한국어 템플릿을 쓴다. (이 프로젝트는 한국어)

PR 제목도 선택한 언어를 따른다. 한국어는 커밋 컨벤션과 동일하게 `<타입>: <한국어 요약>` (타입: feat, fix, refactor, chore; 50자 내외, 마침표 없음). 영문은 `<type>: <summary>` (명령형, 72자 이내).

## 절차

### 1. 상태 확인 (병렬 실행)

- `git branch --show-current` — 현재 브랜치
- `git status --short` — 커밋되지 않은 변경 확인
- `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` — base 브랜치
- `gh pr list --head <현재브랜치> --json url,state` — 이미 열린 PR 여부

중단 조건 (사용자에게 알리고 종료):
- 현재 브랜치가 base 브랜치와 같다 → 작업 브랜치를 먼저 만들어야 한다고 안내한다.
- 이미 열린 PR이 있다 → 해당 URL만 알린다.
- base 대비 커밋 차이가 없다.
- 커밋되지 않은 변경이 있다 → 커밋 여부를 사용자에게 묻도록 보고한다. 임의로 커밋하지 않는다.

### 2. 변경 분석

- `git log <base>..HEAD --oneline` — 포함될 커밋
- `git diff <base>...HEAD --stat` 와 필요한 파일의 `git diff <base>...HEAD -- <파일>` — 실제 변경
- 최신 커밋만이 아니라 **브랜치 전체 커밋**을 기준으로 요약한다.
- `.env`, 키/토큰이 diff에 보이면 PR을 만들지 않고 보고한다.

### 3. 본문 작성

- 선택한 템플릿을 Read로 읽고 섹션 구조를 그대로 유지해 채운다.
- 해당 없는 섹션은 지우지 말고 "해당 없음" / "N/A" 로 둔다.
- "무엇을"보다 **왜 바꿨는지**가 드러나게 쓴다.
- 테스트 체크리스트는 실제로 실행해 확인한 것만 체크한다. 실행하지 않았으면 비워 둔다.
- 시스템 컨텍스트에 PR attribution 지침이 있으면 본문 끝에 따른다.

### 4. 푸시 및 생성

1. 원격에 브랜치가 없거나 뒤처져 있으면 `git push -u origin <현재브랜치>` (force push 금지).
2. 본문은 heredoc으로 전달한다:

```bash
gh pr create --base <base> --title "<제목>" --body "$(cat <<'EOF'
<본문>
EOF
)"
```

3. 사용자가 요청하지 않았다면 draft/리뷰어/라벨은 지정하지 않는다.
4. 결과로 **PR URL, 제목, 사용한 템플릿 언어, 포함된 커밋 수**를 보고한다.

## 금지 사항

- base 브랜치로의 직접 push, `--force`, `--no-verify`
- 요청 없이 커밋 생성, 변경사항 stash/reset
- PR 본문에 API 키 등 비밀 값 포함
