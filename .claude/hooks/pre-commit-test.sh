#!/usr/bin/env bash
# PreToolUse(Bash) 훅: git commit 실행 전 `bun run test`가 통과해야만 허용한다.
# 실패하면 exit 2로 차단하고 stderr를 에이전트에게 전달한다.

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

# git commit 명령이 아니면 통과 (git commit-tree 등은 제외, 체인된 명령 내 commit 포함)
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|&&|\|\|)[[:space:]]*git([[:space:]]+-[^[:space:]]+([[:space:]]+[^[:space:]-][^[:space:]]*)?)*[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

output=$(bun run test 2>&1)
status=$?

if [ $status -ne 0 ]; then
  {
    echo "커밋 차단: 테스트가 실패했습니다 (bun run test, exit $status). 테스트를 통과시킨 뒤 다시 커밋하세요."
    echo "-----"
    printf '%s\n' "$output" | tail -n 40
  } >&2
  exit 2
fi

exit 0
