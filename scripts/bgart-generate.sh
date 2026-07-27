#!/usr/bin/env bash
# caseCollection — 배경 아트 생성 파이프라인 (티켓 13 §⑦ 확정).
#
#   bash scripts/bgart-generate.sh
#   → prototype/core-loop/public/assets/backgrounds/trust-{low,mid,high}.webp
#
# 전제: `higgsfield account status` 통과 + docs/art/style-key.png 존재. 장당 2크레딧(총 6).
#
# ── 왜 3장인가 ───────────────────────────────────────────────────────────────
# 13 §⑦: 배경 = **신뢰축 장면(3장) × 주목축 컬러 그레이딩(CSS)**.
# 08 §⑤의 3×3=9장을 대체한다. 주목(은밀↔공개)은 본질적으로 **광량**이고
# 신뢰(강압↔신중)는 **장면의 내용**이므로, 축마다 성격에 맞는 매체에 실었다.
# 카드의 "명사는 생성, 형용사는 계산"과 같은 원리이며, 더 중요하게는
# **줄다리기가 9개 상태를 점프하지 않고 연속으로 움직인다.**
#
# ── case가 아니라 배경 상태에 귀속한다 ──────────────────────────────────────
# 파일명에 case id가 들어가면 장수가 case 수만큼 불어나 위 근거가 무너진다.
# (2026-07-26 ticket 24 1차 위임이 실제로 `${case.id}-trust-*`로 만들어 교정했다.)
#
# ── 카드 아트와 다른 점 ─────────────────────────────────────────────────────
# 카드는 "장면 없는 사물"이지만 배경은 **장면 자체**다. 단 조명 규칙은 더 엄격하다 —
# 주목축이 CSS 광량으로 계산되므로 극적 조명이 구워져 있으면 계산 조명과 겹쳐 뭉갠다.
# 그리고 추리문이 화면 중앙에 얹히므로(ticket 20 위계) **중앙을 저대비로 비워야** 한다.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/prototype/core-loop/public/assets/backgrounds"
KEY="$ROOT/docs/art/style-key.png"
mkdir -p "$OUT"

# 스타일 키는 카드와 **같은 것**을 문다 — 배경과 카드가 같은 화면에 있으므로.
if [ ! -f "$KEY" ]; then
  echo "FAIL 스타일 키가 없다: $KEY" >&2
  echo "     키 없이 구우면 카드와 배경의 스타일이 어긋난다 — 절차는 docs/art/README.md" >&2
  exit 2
fi

STYLE='Flat cel-shaded graphic-novel noir illustration. Hard black ink contours, heavy flat black shadow masses, no gradients, limited palette of warm grey and pale bone.'
LIGHT='Flat neutral ambient lighting, evenly lit, no dramatic key light, no lamp glow, no coloured light, no rim light, no visible light source.'
COMP='Wide empty interior, deep near-black warm ground, low contrast in the centre of the frame so that overlaid typography stays readable, detail pushed to the edges. No people, no faces, no hands. No text, no lettering, no watermark.'

# 신뢰축 = 장면의 내용. 강압(low) ↔ 신중(high)이 **방의 상태**로 드러난다.
SCENE_LOW='an interrogation room after pressure has been applied: a chair pushed back and overturned, papers scattered loose across the floor, a drawer left hanging open'
SCENE_MID='a plain working record office, orderly and impersonal: stacked document bundles squared on a long table, a closed ledger, empty chairs pushed in'
SCENE_HIGH='a quiet room where cooperation has settled in: two cups of tea set down beside an open ledger, two chairs placed side by side facing the same page'

gen () {
  local band="$1" scene="$2"
  local url
  url=$(higgsfield generate create nano_banana_pro \
      --aspect-ratio 16:9 --resolution 1k \
      --prompt "$STYLE Scene: $scene. $LIGHT $COMP" \
      --image-references "$KEY" --wait --json 2>/dev/null \
    | grep -oP '"result_url": "\K[^"]+' | head -1)
  if [ -n "$url" ]; then
    curl -s -o "$OUT/trust-$band.webp" "$url"
    echo "OK  trust-$band -> $OUT/trust-$band.webp"
    echo "    $url"
  else
    echo "FAIL trust-$band" >&2; exit 1
  fi
}

gen low  "$SCENE_LOW"
gen mid  "$SCENE_MID"
gen high "$SCENE_HIGH"
