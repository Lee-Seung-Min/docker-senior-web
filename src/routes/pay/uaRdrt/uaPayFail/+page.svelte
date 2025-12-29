<!--  비회원 진료 결제  -->
<script>
    import PayRedirect from "$lib/sub/pay/widgets/PayRedirect.svelte";
</script>

<section>
    <div class="">
        <div class="session-expire">
            <div style="text-align: center">
                <img src="/lib/img/pay/error_icon_red.svg" style="width: 70px">
            </div>
            <div style="text-align: center; margin: 10px 0">
                <h1>결제를 실패했습니다.</h1>
            </div>
            <PayRedirect/>
        </div>
    </div>
</section>




<style>
    section {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        padding: 20px;
    }

    .session-expire {
        line-height: 1.5em;
        margin: 0;
        font-weight: 300;
        justify-content: center;
        align-items: center;
        /*height: 80vh*/
    }
</style>