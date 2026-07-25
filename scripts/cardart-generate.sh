#!/usr/bin/env bash
# caseCollection — 카드 아트 생성 파이프라인 (티켓 13 확정).
#
#   bash scripts/cardart-generate.sh <card_id> "<영문 사물 묘사>"
#   bash scripts/cardart-generate.sh thread_fiber "a few loose strands of thread and textile fibre, lying free"
#
# 전제: `higgsfield account status` 통과. 장당 nano_banana_pro 2크레딧.
#
# ── 이 파이프라인의 핵심 원리: **명사는 생성하고 형용사는 계산한다** ──────────
# 카드 아트 = 사물(명사) × 태그 처리(형용사).
#   · 사물 = 카드당 1장 생성 (49장)
#   · 태그 = 런타임 CSS 처리 5종 (은밀/공개/논리/강압/신중)
# 얼굴(facet)마다 굽지 않는 이유: content.ts 실측상 얼굴 55개가 **태그 조합 7종**으로
# 접히고 그중 5종이 55개 중 53개를 덮는다. 구우면 ≈150장, 계산하면 49장 + 처리 5종.
# 게다가 계산본은 **얼굴이 잠기는 순간 전이로 움직인다** — 12의 "배치=수"가 그림이 된다.
#
# ── 생성 규칙 3가지 (전부 실측으로 얻음) ────────────────────────────────────
# ① 용도가 아니라 사물을 그린다.
#    12 §1: 카드의 의미는 이웃이 만든다. 아트가 한 얼굴에 커밋하면 "다면성 발견"이
#    죽는다. 실·섬유를 "빗장을 당기는 실"로 그리면 route 얼굴을 미리 확정해버린다.
# ② 바탕을 평평한 근-흑색으로 못박는다.
#    안 박으면 모델이 흰 표본 카드를 그리고, 흰 바탕은 어둡게 깎아도 **회색 죽**이 되어
#    계산된 태그 처리가 안 먹는다(1차 시도 실패 원인). 테두리·액자·비네트도 금지 —
#    모델이 은근히 내부 보더를 그린다.
# ③ 조명을 중립으로 둔다.
#    극적인 키라이트가 이미 구워져 있으면 은밀/공개 처리가 겹쳐서 뭉갠다.
#    조명은 형용사의 몫이므로 명사에는 넣지 않는다.
set -u
CARD="${1:?card_id 필요}"
DESC="${2:?영문 사물 묘사 필요}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/prototype/core-loop/public/cardart"
KEY="$ROOT/docs/art/style-key.png"   # 스타일 키 — 모든 카드가 이걸 레퍼런스로 문다
mkdir -p "$OUT"

STYLE='Flat cel-shaded graphic-novel noir illustration. Hard black ink contours, heavy flat black shadow masses, no gradients, limited palette of warm grey and pale bone.'
GROUND='IMPORTANT: the background is a single flat near-black field, edge to edge, with no paper, no card, no border, no frame, no vignette, no surface, no table. The subject floats on flat near-black.'
LIGHT='Neutral even lighting on the subject, no dramatic key light, no coloured light, no rim light.'
RULE='Single isolated subject, centered. The object alone as a specimen — no scene, no hands, no action, no narrative. No text, no lettering, no watermark, no signature.'

PROMPT="$STYLE Subject: $DESC. $GROUND $LIGHT $RULE"

REF=()
[ -f "$KEY" ] && REF=(--image-references "$KEY")

url=$(higgsfield generate create nano_banana_pro \
    --aspect-ratio 3:4 --resolution 1k --prompt "$PROMPT" "${REF[@]}" \
    --wait --json 2>/dev/null | grep -oP '"result_url": "\K[^"]+' | head -1)

if [ -n "$url" ]; then
  curl -s -o "$OUT/${CARD}.png" "$url"
  echo "OK  $CARD  -> $OUT/${CARD}.png"
  echo "    $url"   # https CDN URL — 마켓플레이스 커버/아이콘에 그대로 재사용 가능
else
  echo "FAIL $CARD"; exit 1
fi
