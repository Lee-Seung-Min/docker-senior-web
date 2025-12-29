<script>
  // @ts-nocheck
  import {goto} from "$app/navigation";
  import {urlList} from "$lib/urlList.js";
  import {getCall} from "$lib/js/phoneAction.js";

  export let userType;
  export let moduleList;
  export let pgReg;
  export let selectedPayMthd;
  export let initSwiper;
  export let plstList;
  export let hsptBankNull;
  export let hsptBank;

  const standardPayment = "1"   // 일반결제
  const billingKeyPayment = "2" // 빌키결제

</script>

<div class="box_1">
    <div>결제수단</div>
    {#if pgReg == true}
        <div class="">
            {#if moduleList.includes(billingKeyPayment) && userType === "member"}
                <div class="card-box">
                    <label class="radio_box">
                        <input type="radio" value="0" bind:group={selectedPayMthd} on:change={initSwiper}/>
                        <span class="on"></span>
                        등록된 카드로 결제
                    </label>
                    {#if selectedPayMthd == 0}
                        <div class="swiper-container">
                            <div class="swiper-wrapper">
                                {#each plstList as plstInfo}
                                    <div class="swiper-slide card">
                                        <div class="title">
                                            <span>BaroDoctor</span>
                                        </div>
                                        <div class="body"></div>
                                        <div class="content">
                                            <div>
                                                <span class="bank">{plstInfo.cardNm}</span>
                                                <!--                                            <span class="account">계좌</span>-->
                                            </div>
                                            <div class=""><span class="account-number">{plstInfo.cardNo}</span>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                                <div class="swiper-slide card">
                                    <div class="title"></div>
                                    <div class="body">
                                        <div class="rgst">
                                            <img
                                                    src="/lib/img/pay/plus-icon.svg"
                                                    on:click={() => {
                            goto(urlList.uaMbrCrdLst);
                          }}
                                            />
                                        </div>
                                    </div>
                                    <div class="content"></div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
            {#if moduleList.includes(standardPayment)}
            <div class="">
                <label class="radio_box">
                    <input type="radio" value="1" bind:group={selectedPayMthd}/>
                    <span class="on"></span>
                    일반 결제
                </label>
            </div>
            {/if}
        </div>
    {:else}
        <div class="">
            <p style="font-weight: 700;">계좌이체</p>
            <br/>
            {#if !hsptBankNull}
                <dl class="info_dl">
                    <dt>은행명</dt>
                    <dd>{hsptBank.sdtlBank}</dd>
                    <dt>계좌번호</dt>
                    <dd>{hsptBank.sdtlBankNum}</dd>
                </dl>
            {:else}
                병원에 문의하세요. <br/>
                {hsptBank.shpTel}
                <button type="button" class="mbtn_t_1b" on:click={getCall(hsptBank.shpTel)}>전화하기</button>
            {/if}
        </div>
    {/if}
</div>