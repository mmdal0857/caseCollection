<script lang="ts">
  import type { ClueCard, Suit } from '../engine';
  import { SUIT_LABEL, SUIT_ICON } from '../engine';
  import { eul } from '../josa';
  import { publicAssetUrl } from '../public-assets';
  import CardChip from './CardChip.svelte';

  type HandCard = { card: ClueCard; guest: boolean; available: boolean };

  type Readings = { judged: number; knownUnjudged: number; unknown: number; lit: number };

  let { cards, selected, verified, onpick, onviewdetail, readings }: {
    cards: HandCard[];
    selected: string | null;
    verified: string[];
    onpick: (id: string) => void;
    onviewdetail: () => void;
    readings: Readings | null;
  } = $props();

  const suits: Suit[] = ['physical', 'behavioral', 'documentary', 'forensic'];
  let openSuit: Suit | null = $state(null);

  // 집은 카드는 **펼침 밖에서도** 보여야 한다. `.card.selected`(금색 테두리)가 그려지는
  // 유일한 자리가 펼침 안인데 선택 즉시 펼침이 닫히므로(결함 ③ 수정), 고른 순간 표시가
  // 접힌 스택 안으로 숨었다 — "선택 후 클릭할 때까지 어떤 상태인지 알 수 없음"(ticket 31 ⓐ).
  const picked = $derived(selected ? cards.find((item) => item.card.id === selected) ?? null : null);
  const pickedArt = $derived(
    picked
      ? publicAssetUrl(`assets/cards/${picked.card.id}.webp`, import.meta.env.BASE_URL)
      : '',
  );
</script>

<section class="hand-rail" aria-label="핸드">
  {#if picked}
    <p class="picked-readout" role="status">
      <button
        class="picked-thumb suit-{picked.card.suit}"
        type="button"
        aria-label={`${picked.card.name} 상세 보기`}
        onclick={onviewdetail}
      >
        <img src={pickedArt} alt="" />
      </button>
      <!-- 조사는 이름에 **붙어야** 한다. flex 자식으로 떼어놓으면 gap이 끼어들어
           "환기구 틈 을 집었다"가 된다 — 받침 계산이 맞아도 띄어쓰기가 틀리면 소용없다.
           그래서 이름·조사·문장을 한 인라인 덩어리로 묶는다. 을/를 판정은 19의 josa 모듈. -->
      <span><b>{picked.card.name}</b>{eul(picked.card.name)} 집었다</span>
      {#if readings}
        <!-- 빈 상태가 두 가지를 뜻하면 안 된다: "대조할 노트가 없다"와 "노트에 맞는 자리가
             없다"는 다른 사실이다. 침묵 하나로 뭉뚱그리면 컬티스트의 모호함을 축소판으로
             재현한다(ticket 31). -->
        <span class="picked-match" class:lit={readings.lit > 0}>
          {#if readings.lit > 0}노트 대조 — 놓을 자리 {readings.lit}
          {:else if readings.judged === 0}대조할 노트가 아직 없다 — 어디든 놓아보라
          {:else}노트에 맞는 자리가 지금은 없다{/if}
        </span>
        <!-- 두 축을 갈라 센다. 합치면 "더 굴려보면 되는 것"과 "수사를 더 해야 되는 것"이
             구분되지 않는다. -->
        {#if readings.knownUnjudged > 0}<span class="picked-hint">아는데 미판정 {readings.knownUnjudged}</span>{/if}
        {#if readings.unknown > 0}<span class="picked-hint">아직 모름 {readings.unknown}</span>{/if}
      {/if}
    </p>
  {/if}
  <div class="suit-stacks">
    {#each suits as suit (suit)}
      {@const held = cards.filter((item) => item.card.suit === suit)}
      {@const available = held.filter((item) => item.available)}
      <div class="suit-stack" class:open={openSuit === suit}>
        <button
          class="stack-tab suit-{suit}"
          type="button"
          aria-expanded={openSuit === suit}
          onclick={() => (openSuit = openSuit === suit ? null : suit)}
        >
          <span class="stack-icon">{SUIT_ICON[suit]}</span>
          <b>{SUIT_LABEL[suit]}</b>
          <span class="stack-count">{available.length}/{held.length}</span>
          <i>가용/보유</i>
        </button>
        {#if openSuit === suit}
          <div class="stack-fan">
            {#each held as item, i (item.card.id)}
              <div class="fan-card" style:--fan-index={i}>
                <CardChip
                  card={item.card}
                  guest={item.guest}
                  verified={verified.includes(item.card.id)}
                  selected={selected === item.card.id}
                  onclick={() => {
                    openSuit = null;
                    onpick(item.card.id);
                  }}
                />
              </div>
            {/each}
            {#if held.length === 0}<span class="empty-stack">보유 카드 없음</span>{/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</section>
