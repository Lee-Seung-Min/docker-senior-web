<script>
    export let popupOff;
    export let goPayToBln;
</script>

<section class="z_alert">
    <div class="bg"/>
    <div class="box_1">
        <p class="tex">
            결제 하시겠습니까? <br/>
            <button
                    type="button"
                    class="alert_close"
                    on:click={() => {
            popupOff();
          }}
            ><i class="xi-close-min"/>
            </button>
        </p>
        <div class="btn_wrap inline">
            <!--{#if hsptType.ctlsDgns == true || hsptType.vstDgns == true}-->
            <button
                    type="button"
                    class="btn_04"
                    name="chbtn"
                    id="visit"
                    on:click={() => {
            goPayToBln();
          }}
            >
                예
            </button>
            <button
                    type="button"
                    class="btn_01"
                    name="chbtn"
                    id="remote"
                    on:click={() => {
            popupOff();
          }}
            >
                아니오
            </button>
            <!--{/if}-->
        </div>
        <br/>
    </div>
</section>