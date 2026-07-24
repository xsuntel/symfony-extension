---
name: cc-config-helper
description: "이 프로젝트의 Claude Code 설정 아티팩트(서브에이전트·스킬·슬래시 커맨드·규칙·settings 훅·CLAUDE.md)를 2인 팀(author/reviewer) 작업으로 작성·검토하고 타깃 경로에 기록한다. '에이전트 만들어줘', '스킬 작성해줘', '슬래시 커맨드 추가', 'CLAUDE.md 수정', '.claude 설정' 같은 자연어 요청 시 반드시 사용. 단, 설정 파일을 작성·수정하지 않는 Claude Code 기능·사용법 단순 질문에는 사용하지 않는다."
allowed-tools: Agent, Read, Bash, Grep, Write
---

# Claude Code Helper

2인 팀(claude-code-config-author → claude-code-config-reviewer)을 순차 호출해 Claude Code 프로젝트 설정
아티팩트를 작성·검토하고, PASS 판정 시 타깃 경로에 기록한다.

- 작성 언어: **한국어** (프로젝트 `.md` 관례)
- 중간 산출물 위치: `./.claude/tmp/` (gitignore 등록됨)
- 대상: `.claude/agents/**`, `.claude/skills/**/SKILL.md`, `.claude/commands/**`, `.claude/rules/**`,
  `.claude/settings.json`, `CLAUDE.md`

**적용 범위 구분:** 이 스킬은 설정 파일을 **작성·수정**할 때만 사용한다. 설정 변경 없이 Claude Code
기능·사용법을 단순히 **묻는 질문**에는 사용하지 않는다.

@see .claude/agents/utility/claude/code-config-author.md — 초안 작성 규칙(유형별 프론트매터)
@see .claude/agents/utility/claude/code-config-reviewer.md — 검증 체크리스트
@see https://docs.claude.com/en/docs/claude-code/sub-agents — 서브에이전트 스펙
@see https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview — 스킬 스펙

---

## Workflow

1. **요청 해석 (Precondition)**
   - 사용자 요청에서 **아티팩트 유형**(에이전트/스킬/커맨드/규칙/settings/CLAUDE.md)과 **타깃 경로**를 결정한다.
   - 유형·경로가 불명확하면 진행 전에 **한 번의 명확한 질문**으로 확정한다(여러 모호성을 동시에 묻지 않는다).

2. **Author 호출**
   - `claude-code-config-author` 에이전트를 호출하며 프롬프트에 **아티팩트 유형·타깃 경로·요구사항**을 전달한다.
   - 산출물: `./.claude/tmp/utility/claude/code-draft.md`.

3. **Reviewer 호출**
   - `claude-code-config-reviewer` 에이전트를 호출하며 프롬프트에 **타깃 경로·아티팩트 유형**을 전달한다.
   - 산출물: `./.claude/tmp/utility/claude/code-review.md`.

4. **판정 분기**
   - **PASS:** draft를 타깃 경로에 기록한다.
     - 필요한 상위 디렉토리를 먼저 생성한다(`mkdir -p "$(dirname <타깃경로>)"`).
     - `cp ./.claude/tmp/utility/claude/code-draft.md <타깃경로>` (또는 동등한 Write)로 기록하고,
       기록 경로와 요약을 보고한 뒤 종료.
   - **REDO:** `./.claude/tmp/utility/claude/code-review.md`의 수정 지시를 Author 재호출 프롬프트에 포함해
     2단계부터 반복한다. **재시도는 최대 2회.**

5. **재시도 한계 처리**
   - 재시도 2회 후에도 REDO면 **타깃 경로에 기록하지 않는다.**
   - 마지막 draft 내용을 사용자에게 제시하고 "자동 승인 한계 도달 — 수동 검토 권장"
     경고와 함께 종료한다.
