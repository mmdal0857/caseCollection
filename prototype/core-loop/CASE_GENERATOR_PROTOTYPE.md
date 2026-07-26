# PROTOTYPE — case generator contract explorer

이 프로토타입은 다음 질문을 답한다.

> 확정된 `patternRecipe + storySeed.requires`에서 엔진이 기존 카드·측면만 사용해 합법 후보를 결정론적으로 만들고, 상태 조건부 `solutions[]`를 배치 시점에 동결해 이후 상태 변화가 확정 해답을 뒤집지 않게 할 수 있는가?

프로토타입이며 production 경로가 아니다. 순수 로직은 `src/lib/case-generator-prototype.ts`, 조작용 TUI는 `case-generator-prototype.ts`에 있다.

## 실행

```powershell
npm run prototype:case-generator
```

자동 증거 출력:

```powershell
npm run prototype:case-generator:demo
```

TUI에서 case와 가변축 catalog 변형을 바꾸고, `heat / trust / axis`를 움직이며 합법 후보와 조건부 해답 안정성을 확인한다. 화면의 `live 재평가 시 뒤집힘`은 기존 `CondAnswer` 방식의 위험이고, `lock-time 동결 계약`은 새 `solutions[]` 방식의 결과다.

