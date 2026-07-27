#!/usr/bin/env bash
# 티켓 13 — 카드 아트 스타일 키 시안 재현 레시피.
#
# 시안 PNG는 커밋하지 않는다(.gitignore: prototype/core-loop/public/protoart/).
# 이 스크립트가 정본 — 8장 재생성에 nano_banana_pro 기준 16크레딧, 약 4분.
#
#   bash scripts/protoart-prompts.sh
#   → prototype/core-loop/public/protoart/*.png
#   → npx vite --port 5199  후  /?artstyle=A|B|C|D|off&frame=band|plate|full
#
# 전제: `higgsfield account status`가 통과하는 인증 상태.
set -u
OUT="$(cd "$(dirname "$0")/.." && pwd)/prototype/core-loop/public/protoart"
mkdir -p "$OUT"

# ── 모든 카드 아트에 공통으로 거는 제약 ──────────────────────────────────────
# 티켓 12 §1이 근거: 카드의 의미는 이웃이 만들고 배경 상태가 게이트한다.
# 아트가 한 측면(용도)에 시각적으로 커밋하면 "다면성 발견"이라는 재미를 아트가 죽인다.
# → **용도가 아니라 사물을 그린다.** 장면·손·행위·서사 금지.
COMMON='Single isolated subject, centered, plain dark background. The object alone as a specimen — no scene, no hands, no action, no narrative. No text, no lettering, no watermark, no signature.'

STYLE_A='Flat cel-shaded graphic-novel noir illustration. Hard black ink contours, limited desaturated palette of slate teal, warm grey and dusty rose against a near-black warm ground, heavy flat black shadow masses, no gradients.'
STYLE_B='Antique engraved catalogue plate. Fine cross-hatching and stipple line work, monochrome warm sepia ink on aged off-white paper, 19th century natural-history specimen illustration, precise and dry.'
STYLE_C='Cold forensic evidence photograph. Desaturated, subject isolated on a neutral grey surface under flat direct flash, fine film grain, clinical and unstyled, slight vignette.'
STYLE_D='Bold flat silhouette poster in mid-century serigraph style. Two or three flat colours only, one warm amber accent against deep charcoal, no shading, no line detail, maximum legibility at small size.'

# ── 스트레스 대상 2종 ────────────────────────────────────────────────────────
# s1: 12 §1의 대표 다면 카드. 아트가 세 측면 중 하나로 기울면 실패.
# s2: 존재하지 않는 것(증언의 공백)을 그리는 문제. behavioral 6종의 최악 케이스 —
#     이걸 그리는 스타일이면 49종을 그린다.
S1='Subject: a few loose strands of thread and textile fibre, lying free, nothing else.'
S2='Subject: the figure-shaped absence where a person should be — a vacant unfilled human outline, a gap in the place a person would stand.'

gen () {
  local name="$1" prompt="$2" url
  url=$(higgsfield generate create nano_banana_pro \
      --aspect-ratio 2:3 --resolution 1k --prompt "$prompt" --wait --json 2>/dev/null \
    | grep -oP '"result_url": "\K[^"]+' | head -1)
  if [ -n "$url" ]; then curl -s -o "$OUT/${name}.png" "$url"; echo "OK  ${name}"; else echo "FAIL ${name}"; fi
}

for s in A B C D; do
  case $s in A) ST="$STYLE_A";; B) ST="$STYLE_B";; C) ST="$STYLE_C";; D) ST="$STYLE_D";; esac
  gen "style${s}_s1_thread"  "$ST $S1 $COMMON"
  gen "style${s}_s2_absence" "$ST $S2 $COMMON"
done
echo "DONE — $OUT"
