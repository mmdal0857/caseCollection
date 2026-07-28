<script lang="ts">
  import type { AudioPort, AudioSettings } from '../audio';

  let { audio }: { audio: AudioPort } = $props();
  let settings = $state<AudioSettings>({
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    muted: false,
  });

  $effect(() => {
    audio;
    settings = audio.getSettings();
  });

  function toggleMute(): void {
    audio.setMuted(!settings.muted);
    settings = audio.getSettings();
  }

  function setVolume(
    key: 'master' | 'music' | 'sfx',
    event: Event,
  ): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    audio.setVolumes({ [key]: value });
    settings = audio.getSettings();
  }
</script>

<details class="audio-settings">
  <summary aria-label="오디오 설정">
    {settings.muted ? '음소거' : '오디오'}
  </summary>
  <div class="audio-settings-panel">
    <button type="button" onclick={toggleMute}>
      {settings.muted ? '음소거 해제' : '전체 음소거'}
    </button>
    <label>
      <span>전체</span>
      <input
        aria-label="전체 볼륨"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={settings.master}
        oninput={(event) => setVolume('master', event)}
      />
    </label>
    <label>
      <span>음악</span>
      <input
        aria-label="음악 볼륨"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={settings.music}
        oninput={(event) => setVolume('music', event)}
      />
    </label>
    <label>
      <span>효과음</span>
      <input
        aria-label="효과음 볼륨"
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={settings.sfx}
        oninput={(event) => setVolume('sfx', event)}
      />
    </label>
  </div>
</details>
