#!/usr/bin/env bash
# PreToolUse(Write|Edit|NotebookEdit) 훅: 파일 생성/수정 직전에 .claude/rules/tdd.md 핵심을 상기시킨다.
# 차단하지 않고 additionalContext로 프롬프트만 주입한다.

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')

case "$file" in
  *.test.ts|*.test.tsx)
    msg="[TDD 리마인더] 테스트 파일을 작성/수정 중이다. 하나의 동작 = 하나의 테스트. 작성 후 반드시 실행해서 '기능 미구현'으로 실패(RED)하는지 확인하라. 문법/import/셋업 오류로 인한 실패는 RED가 아니다."
    ;;
  *)
    msg="[TDD 리마인더] 프로덕션 코드를 작성/수정하기 전에 확인하라. (1) 비즈니스 로직·API·유틸·버그 수정이면 실패하는 테스트를 먼저 작성하고 실행해 RED를 확인했는가? 경계가 모호하면 적용 대상이다. (2) 테스트보다 코드를 먼저 썼다면 삭제하고 RED부터 재시작한다(참고용 보관·주석 처리 금지). (3) GREEN은 테스트를 통과시키는 최소한의 코드만, REFACTOR는 새 동작 없이 green 유지. (타입 정의·설정 파일·순수 UI는 면제) 전문: .claude/rules/tdd.md"
    ;;
esac

jq -n --arg msg "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$msg}}'
exit 0
