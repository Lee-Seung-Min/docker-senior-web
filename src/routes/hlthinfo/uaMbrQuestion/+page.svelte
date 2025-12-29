<script>
  // @ts-nocheck
  let currentPage = 1;
  const totalPages = 4;

  let answers = {
    diagnosis: [],
    medication: [],
    familyHistory: [],
    hepatitisB: '',

    smoking: '',
    nowSmoking:'',
    currentSmokingYear: '',
    smokingDay:'',
    pastSmokingYear:'',
    pastSmokingDay:'',
    quitSmokingYear:'',

    electroSmoking:'',
    nowElectroSmoking:'',
    currentElectroSmokingYear:'',
    electroSmokingDay:'',
    pastElectroSmokingYear:'',
    pastElectroSmokingDay:'',
    quitElectroSmokingYear:'',

    liquidSmoking:'',
    liquidSmokingNum:'',

    drinking:'',
    drinkingNumOpt:'',
    drinkingNum:'',

    drinkSoju:false,
    drinkSojuNum:'',
    drinkSojuNumOpt:'',

    drinkBeer:false,
    drinkBeerNum:'',
    drinkBeerNumOpt:'',

    drinkSpirit:false,
    drinkSpiritNum:'',
    drinkSpiritNumOpt:'',

    drinkRicewine:false,
    drinkRicewineNum:'',
    drinkRicewineNumOpt:'',

    drinkWine:false,
    drinkWineNum:'',
    drinkWineNumOpt:'',

    maxDrinkSoju:false,
    maxDrinkSojuNum:'',
    maxDrinkSojuNumOpt:'',

    maxDrinkBeer:false,
    maxDrinkBeerNum:'',
    maxDrinkBeerNumOpt:'',

    maxDrinkSpirit:false,
    maxDrinkSpiritNum:'',
    maxDrinkSpiritNumOpt:'',

    maxDrinkRicewine:false,
    maxDrinkRicewineNum:'',
    maxDrinkRicewineNumOpt:'',

    maxDrinkWine:false,
    maxDrinkWineNum:'',
    maxDrinkWineNumOpt:'',

    hardExerciseWeek:'',
    hardExerciseDayHour:'',
    hardExerciseDayMinute:'',
    middleExerciseWeek:'',
    middleExerciseDayHour:'',
    middleExerciseDayMinute:'',
    muscleExerciseWeek:'',
  };

  function numberOnly(node) {
    const handleInput = () => {
      node.value = node.value.replace(/\D/g, '');

      node.dispatchEvent(new Event('input', { bubbles: true }));
    };

    // input 이벤트에 리스너를 추가합니다.
    node.addEventListener('input', handleInput);

    // 요소가 DOM에서 제거될 때 이벤트 리스너도 함께 제거합니다. (메모리 누수 방지)
    return {
      destroy() {
        node.removeEventListener('input', handleInput);
      }
    };
  }

  function goToNextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function submit() {
    alert("문진표가 제출되었습니다.\n\n" + JSON.stringify(answers, null, 2));
  }

  const diagnosisList = ['뇌졸중(중풍)', '심장병(심근경색/협심증)', '고혈압', '당뇨병', '이상지질혈증', '폐결핵', '기타(암 포함)'];
  const familyHistoryList = ['뇌졸중(중풍)', '심장병(심근경색/협심증)', '고혈압', '당뇨병', '기타(암 포함)'];

</script>

<div class="container">
  <main class="content-area">
    <!-- 1 페이지 -->
    {#if currentPage === 1}
      <div class="question-group">
        <h2 class="title">일반 검진</h2>
        <p class="subtitle">과거력, 가족력 관련 문항</p>

        <div class="question">
          <label class="question-label">1. 다음과 같은 질병으로 진단을 받았거나 현재 약물 치료 중이십니까?</label>
          <p class="section-title">진단 여부 (여러 개 선택 가능)</p>
          <div class="options-grid">
            {#each diagnosisList as item}
              <label class="option-label">
                <input type="checkbox" bind:group={answers.diagnosis} value={item} />
                <span class="option-span">{item}</span>
              </label>
            {/each}
          </div>
          <p class="section-title">약물치료 여부 (여러 개 선택 가능)</p>
          <div class="options-grid">
            {#each diagnosisList as item}
              <label class="option-label">
                <input type="checkbox" bind:group={answers.medication} value={item} />
                <span class="option-span">{item}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="question">
          <label class="question-label">2. 부모, 형제, 자매 중에 다음 질환을 앓았거나 해당 질환으로 사망한 경우가 있으십니까?</label>
          <p class="section-title">여러 개 선택 가능</p>
          <div class="options-grid">
            {#each familyHistoryList as item}
              <label class="option-label">
                <input type="checkbox" bind:group={answers.familyHistory} value={item} />
                <span class="option-span">{item}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="question">
          <label class="question-label">3. B형간염 항원보유자입니까?</label>
            <p class="section-title">하나만 선택 가능</p>
          <div class="options-grid single-select">
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.hepatitisB} value="yes" />
              <span>예</span>
            </label>
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.hepatitisB} value="no" />
              <span>아니오</span>
            </label>
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.hepatitisB} value="unknown" />
              <span>모름</span>
            </label>
          </div>
        </div>
      </div>
    {/if}

    {#if currentPage === 2}
      <div class="question-group">
        <h2 class="title">일반 검진</h2>
        <p class="subtitle">흡연 및 전자담배</p>
        <div class="question">
          <label class="question-label">4. 지금까지 평생 총 5갑(100개비)이상의 담배를 피운 적이 있습니까?</label>
          <p class="section-title">하나만 선택 가능</p>
          <div class="options-grid single-select">
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.smoking} value="yes" />
              <span>예</span>
            </label>
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.smoking} value="no" />
              <span>아니오</span>
            </label>
          </div>
        </div>

        {#if answers.smoking == "yes"}
          <div class="question">
            <label class="question-label">4-1. 현재 일반담배(궐련)을 피우십니까?</label>
            <p class="section-title">하나만 선택 가능</p>
            <div class="options-grid single-select">
              <label class="option-label radio-label">
                <input type="radio" bind:group={answers.nowSmoking} value="yes" />
                <span>현재 피움</span>
              </label>
              <label class="option-label radio-label">
                <input type="radio" bind:group={answers.nowSmoking} value="no" />
                <span>과거에는 피웠으나 현재 피우지 않음</span>
              </label>
            </div>
          </div>
          {#if answers.nowSmoking == "yes"}
            <div class="question">
              <p class="section-title">지금까지 피운 기간</p>
              <input type="text" class="text-input" bind:value={answers.currentSmokingYear} placeholder="숫자를 입력해주세요." />
            </div>
            <div class="question">
              <p class="section-title">하루평균 피우는 개비 수</p>
              <input type="text" class="text-input" bind:value={answers.smokingDay} placeholder="숫자를 입력해주세요." />
            </div>
          {/if}

          {#if answers.nowSmoking == "no"}
            <div class="question">
              <p class="section-title">피웠던 기간</p>
              <input type="text" class="text-input" bind:value={answers.pastSmokingYear} placeholder="숫자를 입력해주세요." />
            </div>
            <div class="question">
              <p class="section-title">하루평균 피웠던 개비 수</p>
              <input type="text" class="text-input" bind:value={answers.pastSmokingDay} placeholder="숫자를 입력해주세요." />
            </div>
            <div class="question">
              <p class="section-title">끊은 이후로 몇년이 지났나요?</p>
              <input type="text" class="text-input" bind:value={answers.quitSmokingYear} placeholder="숫자를 입력해주세요." />
            </div>
          {/if}
        {/if}

        <div class="question">
          <label class="question-label">5. 지금까지 권련형 전자담배(가열담배, 예) 아이코스, 글로, 릴 등)을 사용한 적 있습니까?</label>
          <p class="section-title">하나만 선택 가능</p>
          <div class="options-grid single-select">
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.electroSmoking} value="yes" />
              <span>예</span>
            </label>
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.electroSmoking} value="no" />
              <span>아니오</span>
            </label>
          </div>
        </div>

        {#if answers.electroSmoking == "yes"}
          <div class="question">
            <label class="question-label">5-1. 현재 궐련형 전자담배(가열담배)를 사용하십니까?</label>
            <p class="section-title">하나만 선택 가능</p>
            <div class="options-grid single-select">
              <label class="option-label radio-label">
                <input type="radio" bind:group={answers.nowElectroSmoking} value="yes" />
                <span>현재 피움</span>
              </label>
              <label class="option-label radio-label">
                <input type="radio" bind:group={answers.nowElectroSmoking} value="no" />
                <span>과거에는 피웠으나 현재 피우지 않음</span>
              </label>
            </div>
          </div>
        {/if}
        
        {#if answers.nowElectroSmoking == "yes"}
          <div class="question">
            <p class="section-title">지금까지 피운 기간</p>
            <input type="text" class="text-input" bind:value={answers.currentElectroSmokingYear} placeholder="숫자를 입력해주세요." />
          </div>
          <div class="question">
            <p class="section-title">하루평균 피우는 개비 수</p>
            <input type="text" class="text-input" bind:value={answers.electroSmokingDay} placeholder="숫자를 입력해주세요." />
          </div>
        {/if}

        {#if answers.nowElectroSmoking == "no"}
          <div class="question">
            <p class="section-title">피웠던 기간</p>
            <input type="text" class="text-input" bind:value={answers.pastElectroSmokingYear} placeholder="숫자를 입력해주세요." />
          </div>
          <div class="question">
            <p class="section-title">하루평균 피웠던 개비 수</p>
            <input type="text" class="text-input" bind:value={answers.pastElectroSmokingDay} placeholder="숫자를 입력해주세요." />
          </div>
          <div class="question">
            <p class="section-title">끊은 이후로 몇년이 지났나요?</p>
            <input type="text" class="text-input" bind:value={answers.quitElectroSmokingYear} placeholder="숫자를 입력해주세요." />
          </div>
        {/if}
      </div>

      <div class="question">
        <label class="question-label">6. 액상형 전자담배를 사용한 경험이 있습니까?</label>
        <p class="section-title">하나만 선택 가능</p>
        <div class="options-grid single-select">
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmoking} value="yes" />
            <span>예</span>
          </label>
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmoking} value="no" />
            <span>아니오</span>
          </label>
        </div>
      </div>

      {#if answers.liquidSmoking == "yes"}
        <label class="question-label">6-1. 최근 한 달 동안 액상형 전자담배를 사용한 경험이 있습니까?</label>
        <p class="section-title">하나만 선택 가능</p>
        <div class="options-grid single-select">
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmokingNum} value="zero" />
            <span>아니오</span>
          </label>
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmokingNum} value="oneTwo" />
            <span>월 1-2일</span>
          </label>
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmokingNum} value="threeNine" />
            <span>월 3-9일</span>
          </label>
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmokingNum} value="tenThirty" />
            <span>월 10-29일</span>
          </label>
          <label class="option-label radio-label">
            <input type="radio" bind:group={answers.liquidSmokingNum} value="everyday" />
            <span>매일</span>
          </label>
        </div>
      {/if}
    {/if}

    {#if currentPage === 3}
      <div class="question-group">
        <h2 class="title">일반 검진</h2>
        <p class="subtitle">음주(지난 1년간)</p>

        <div class="question">
          <label class="question-label">7. 술을 마시는 횟수는 어느정도 입니까?</label>
          <p class="section-title">하나만 선택 가능</p>
          <div class="options-grid single-select">
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.drinking} value="yes" />
              <span>술을 마신다.</span>
            </label>
            <label class="option-label radio-label">
              <input type="radio" bind:group={answers.drinking} value="no" />
              <span>술을 마시지 않는다.</span>
            </label>
          </div>
          {#if answers.drinking == "yes"}
            <div class="question" style="margin-top: 10px">
              <p class="section-title">몇번 마시시나요?</p>
              <div style="display: flex;">
                <select style="border: 1px solid black; border-radius: 10px; margin-right: 10px" bind:value={answers.drinkingNumOpt}>
                  <option value=""></option>
                  <option value="weekly">일주일에</option>
                  <option value="monthly">한달에</option>
                  <option value="yearly">1년에</option>
                </select>
                <input type="text" class="text-input" bind:value={answers.drinkingNum} placeholder="숫자를 입력해주세요." />
              </div>
            </div>

            <div class="question">
              <label class="question-label">7-1. 술을 마시는 날은 보통 어느정도 마십니까?</label>
              <p class="section-title">* 잔 또는 병 또는 캔 또는 cc 중 한 곳에만 작성해 주십시오.(술 종류는 복수응답 가능, 하루에 마신 총 양으로 합산. 기타 술 종류는 비슷한 술 종류에 표기)</p>
              <div style="display: flex; gap: 10px;">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.drinkSoju} />
                  <span class="option-span">소주</span>
                </label>
                <input type="text" disabled={!answers.drinkSoju} class="text-input" style="flex: 1;" bind:value={answers.drinkSojuNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.drinkSoju} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.drinkSojuNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.drinkBeer} />
                  <span class="option-span">맥주</span>
                </label>
                <input type="text" disabled={!answers.drinkBeer} class="text-input" style="flex: 1;" bind:value={answers.drinkBeerNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.drinkBeer} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.drinkBeerNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.drinkSpirit} />
                  <span class="option-span">양주</span>
                </label>
                <input type="text" disabled={!answers.drinkSpirit} class="text-input" style="flex: 1;" bind:value={answers.drinkSpiritNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.drinkSpirit} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.drinkSpiritNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.drinkRicewine} />
                  <span class="option-span">막걸리</span>
                </label>
                <input type="text" disabled={!answers.drinkRicewine} class="text-input" style="flex: 1;" bind:value={answers.drinkRicewineNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.drinkRicewine} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.drinkRicewineNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.drinkWine} />
                  <span class="option-span">와인</span>
                </label>
                <input type="text" disabled={!answers.drinkWine} class="text-input" style="flex: 1;" bind:value={answers.drinkWineNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.drinkWine} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.drinkWineNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>
            </div>

            <div class="question">
              <label class="question-label">7-2. 하루동안 가장 많이 마셨던 음주량은 어느정도 입니까?</label>
              <p class="section-title">* 잔 또는 병 또는 캔 또는 cc 중 한 곳에만 작성해 주십시오.(술 종류는 복수응답 가능, 하루에 마신 총 양으로 합산. 기타 술 종류는 비슷한 술 종류에 표기)</p>
              <div style="display: flex; gap: 10px;">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.maxDrinkSoju} />
                  <span class="option-span">소주</span>
                </label>
                <input type="text" disabled={!answers.maxDrinkSoju} class="text-input" style="flex: 1;" bind:value={answers.maxDrinkSojuNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.maxDrinkSoju} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.maxDrinkSojuNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.maxDrinkBeer} />
                  <span class="option-span">맥주</span>
                </label>
                <input type="text" disabled={!answers.maxDrinkBeer} class="text-input" style="flex: 1;" bind:value={answers.maxDrinkBeerNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.maxDrinkBeer} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.maxDinkBeerNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.maxDrinkSpirit} />
                  <span class="option-span">양주</span>
                </label>
                <input type="text" disabled={!answers.maxDrinkSpirit} class="text-input" style="flex: 1;" bind:value={answers.maxDrinkSpiritNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.maxDrinkSpirit} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.maxDrinkSpiritNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.maxDrinkRicewine} />
                  <span class="option-span">막걸리</span>
                </label>
                <input type="text" disabled={!answers.maxDrinkRicewine} class="text-input" style="flex: 1;" bind:value={answers.maxDrinkRicewineNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.maxDrinkRicewine} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.maxDrinkRicewineNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; margin-top:10px">
                <label class="option-label checkbox-drink">
                  <input type="checkbox" bind:checked={answers.maxDrinkWine} />
                  <span class="option-span">와인</span>
                </label>
                <input type="text" disabled={!answers.maxDrinkWine} class="text-input" style="flex: 1;" bind:value={answers.maxDrinkWineNum} placeholder="숫자를 입력해주세요." />
                <select disabled={!answers.maxDrinkWine} style="border: 1px solid black; border-radius: 10px;" bind:value={answers.maxDrinkWineNumOpt}>
                  <option value=""></option>
                  <option value="cup">잔</option>
                  <option value="bottle">병</option>
                  <option value="cc">cc</option>
                </select>
              </div>
            </div>

          {/if}
        </div>
      </div>
    {/if}

    {#if currentPage === 4}
      <div class="question-group">
        <h2 class="title">일반 검진</h2>
        <p class="subtitle">신체활동(운동)</p>
        <div class="question">
          <label class="question-label">8-1. 평소 1주일간, 숨이 많이 차게 만드는 고강도 신체활동을 며칠 하십니까?</label>
          <p class="section-title">* 고강도 신체활동의 예) 달리기, 에어로빅, 빠른 속도로 자전거 타기, 건설 현장 노동, 계단으로 물건 나르기 등</p>
          <div style="display: flex; align-items: center; gap: 5px;">
            <input type="text" class="text-input" bind:value={answers.hardExerciseWeek} placeholder="숫자를 입력해주세요." />
            <span>일</span>
          </div>
        </div>

        <div class="question">
          <label class="question-label">8-2. 평소 하루에 숨이 많이 차게 만드는 고강도 신체활동을 몇 시간 하십니까?</label>
          <div style="display: flex; align-items: center; gap: 5px;">
            <input type="text" class="text-input" bind:value={answers.hardExerciseDayHour} placeholder="숫자를 입력해주세요." />
            <span>시간</span>
            <input type="text" class="text-input" bind:value={answers.hardExerciseDayMinute} placeholder="숫자를 입력해주세요." />
            <span>분</span>
          </div>
        </div>

        <div class="question">
          <label class="question-label">9-1. 평소 1주일간, 숨이 약간 차게 만드는 중강도 신체활동을 며칠 하십니까?</label>
          <p class="section-title">* 8번 응답에 관련된 신체활동은 제외하고 답해주십시오.</p>
          <p class="section-title">* 중강도 신체활동의 예) 빠르게 걷기, 복식 테니스, 보통 속도로 자전거 타기, 가벼운 물건 나르기, 청소 등</p>
          <div style="display: flex; align-items: center; gap: 5px;">
            <input type="text" class="text-input" bind:value={answers.middleExerciseWeek} placeholder="숫자를 입력해주세요." />
            <span>일</span>
          </div>
        </div>

        <div class="question">
          <label class="question-label">9-2. 평소 하루에 숨이 약간 차게 만드는 중강도 신체활동을 몇 시간 하십니까?</label>
          <div style="display: flex; align-items: center; gap: 5px;">
            <input type="text" class="text-input" bind:value={answers.middleExerciseDayHour} placeholder="숫자를 입력해주세요." />
            <span>시간</span>
            <input type="text" class="text-input" bind:value={answers.middleExerciseDayMinute} placeholder="숫자를 입력해주세요." />
            <span>분</span>
          </div>
        </div>

        <div class="question">
          <label class="question-label">10. 최근 1주일 동안 팔굽혀펴기, 윗몸일으키기, 아령, 역기, 철봉 등 근력 운동을 한 날은 며칠입니까?</label>
          <div style="display: flex; align-items: center; gap: 5px;">
            <input type="text" class="text-input" bind:value={answers.muscleExerciseWeek} placeholder="숫자를 입력해주세요." />
            <span>일</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="bottom-bar">
      <div class="pagination">{currentPage}/{totalPages}</div>
      <div class="button-group">
        {#if currentPage > 1}
        <button class="btn btn-secondary" on:click={goToPrevPage}>이전</button>
        {/if}
      
        {#if currentPage < totalPages}
        <button class="btn btn-primary" on:click={goToNextPage}>다음</button>
        {:else}
        <button class="btn btn-primary" on:click={submit}>저장</button>
        {/if}
      </div>
    </div>
  </main>

  
</div>

<style>
  .container {
    max-width: 480px;
    margin: 0 auto;
    background-color: #f4f7f6;
  }

  .content-area {
    padding: 24px 20px 100px;
  }

  input[type="radio"] + span {
    background-color: transparent;
    color:#666666;
    border: 0px solid #ccc;
  }

  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #ffffff;
    border-top: 1px solid #e0e0e0;
  }

  .question-group {
    margin-bottom: 32px;
  }
  .title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }
  .subtitle {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
    margin-bottom: 24px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 16px;
  }
  .question {
    margin-bottom: 28px;
  }
  .question-label {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
    display: block;
  }
  .section-title {
    font-size: 14px;
    color: #888;
    margin: 10px 0;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .options-grid.single-select {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .option-label {
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .option-label:has(input:checked) {
    border-color: #007bff;
    background-color: #e7f3ff;
    color: #0056b3;
    font-weight: bold;
  }
  .option-label:has(input:checked) span::before {
    content: '✓';
    font-weight: bold;
    margin-right: 5px;
  }
  .option-label input {
    display: none;
  }

  .option-label.checkbox-drink {
    width:100px;
  }

  .option-label.checkbox-drink span::before {
    content: '✓';
    font-weight: bold;
    margin-right: 5px;
    color:transparent;
  }

  .option-label.checkbox-drink:has(input:checked) span::before {
    color:inherit;
  }

  .option-label.radio-label {
    padding: 0;
  }

  .option-span {
    background: none;
    width: auto;
  }

  .text-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 16px;
    box-sizing: border-box;
  }
  .text-input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .button-group {
    display: flex;
    gap: 10px;
  }
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  .btn-secondary {
    background-color: #e9ecef;
    color: #495057;
  }
  .pagination {
    font-size: 14px;
    color: #666;
  }
</style>