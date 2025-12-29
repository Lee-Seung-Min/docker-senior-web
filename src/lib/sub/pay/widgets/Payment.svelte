<script>
  // @ts-nocheck
  import {goto} from "$app/navigation";
  import {urlList} from "$lib/urlList.js";

  export let dgnsInfo;
  export let amt;
  export let isPayLoading;
  export let goPayCheck;
  export let userType;
</script>

<div class="bottom_btn_fixed">
    <div class="btn_wrap inline">
        {#if dgnsInfo.mpayStat === '5'}
            <button
                    type="button"
                    class="btn_03"
                    id="show"
                    on:click|stopPropagation={() => { if (userType === "member") goto(urlList.uaDgnsLst);}}
                    value="결제모듈"
            >{amt}원 결제완료
            </button>
        {:else if dgnsInfo.mpayStat === '0' || dgnsInfo.mpayStat === '7' || dgnsInfo.mpayStat === '8' || dgnsInfo.mpayStat === '9'}
            {#if isPayLoading === false}
                <button
                        type="button"
                        class="btn_01"
                        id="show"
                        on:click={() => {
                goPayCheck();
              }}
                        value="결제모듈"
                >{amt}원 결제하기
                </button>
            {:else}
                <button type="button" class="btn_01" id="show" value="결제모듈">결제중</button>
            {/if}
        {:else}
            <div></div>
        {/if}
    </div>
</div>