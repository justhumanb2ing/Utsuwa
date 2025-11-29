# components/AGENTS.md

## 개요
항상 shadcn/ui 에서 제공하는 컴포넌트를 우선적으로 검토하여 사용합니다.
필요한 컴포넌트가 설치되어 있지 않다면 `bunx shadcn-ui@latest add <component>`로 추가 후 사용합니다.

## 스타일링
- TailwindCSS 유틸리티로 신속 개발.
- 주요 섹션은 별도 컴포넌트로 분리.
- flex 레이아웃은 Tailwind `flex` 유틸리티 또는 실제 존재하는 shadcn/ui 컴포넌트(Stack/Grid 등 설치된 것만)로 구성합니다.

## 디자인 시스템
- shadcn/ui를 기본으로 따르고, 변경 시 이유를 명확히 기록한다.

## 네이밍
- 파일명 kebab-case, 컴포넌트 PascalCase.
- 모든 커스텀 훅은 use로 시작한다.
