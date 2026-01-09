<script>
    // @ts-nocheck

    export let sectionClass = "location";
</script>

<!--상단 바 Nav 부분-->
<!-- content S -->
<section class="loading-boxs">
    <section class="loading-contents">
        <div class="box_1" style="margin: 0 30px">
            <div class="tex" style="text-align: center">
                <div style="font-size: 20px; font-weight: 500; padding: 12px 0">남원 e케어</div>
            </div>
            <div class="btn_wrap">
                <div class="loading" style="text-align: center;">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    </section>
</section>

<style>
    /* Google Web Font */
    @import url("https://fonts.googleapis.com/css?family=Raleway&display=swap");

    section {
        line-height: 1.5em;
        margin: 0;
        font-weight: 300;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }

    a {
        text-decoration: none;
    }

    .loading {
    }
    .loading span {
        display: inline-block;
        width: 15px;
        height: 15px;
        background-color: grey;
        border-radius: 50%;
        animation: loading 1s linear infinite;
    }

    .loading span:nth-child(1) {
        animation-delay: 0s;
        background-color: dodgerblue;
    }
    .loading span:nth-child(2) {
        animation-delay: 0.2s;
        background-color: cornflowerblue;
    }
    .loading span:nth-child(3) {
        animation-delay: 0.4s;
        background-color: royalblue;
    }

    @keyframes loading {
        0%,
        100% {
            opacity: 0;
            transform: scale(0.5);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
    }

    .loading-boxs {
        /*display: display;*/
        position: fixed;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        /*z-index: ;*/
        background-color: #ececec;
        /*background-color: rgba(0, 0, 0, 0.8);*/
    }
    .loading-contents {
        /*display: display;*/
        /*position: fixed;*/
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        /*z-index: ;*/
        /*background-color: #ececec;*/
        /*background-color: rgba(0, 0, 0, 0.8);*/
    }
</style>
