<!--  진료 결제  -->
<script>
    // @ts-nocheck

    import {onDestroy, onMount} from "svelte";
    import PageLoader from "$lib/sub/PageLoader.svelte";
    import {getUserId} from "$lib/js/getUserId.js";
    import {updateRefresh} from "$lib/js/updateRefresh.js";
    import {isLogin} from "$lib/store/loginStore.js";
    import Swiper from "swiper";
    import PayInfo from "$lib/sub/pay/widgets/PayInfo.svelte";
    import PayMethod from "$lib/sub/pay/widgets/PayMethod.svelte";
    import Payment from "$lib/sub/pay/widgets/Payment.svelte";
    import PayPopUp from "$lib/sub/pay/widgets/PayBlnPopUp.svelte";
    import {useDgnsInfo} from "$lib/store/pay/useDgnsInfo.js"
    import {useSmartroPay} from "$lib/store/pay/useSmartroPay.js"
    import {useAllthatPay} from "$lib/store/pay/useAllthatPay.js";
    import {get} from "svelte/store";

    export let dgnsId;
    export let userType;

    // client
    const dgnsClient = useDgnsInfo  // 진료정보 client
    let unsubscribeDgnsClient = [];
    let pgClient = null;    // 가맹점 PG client
    let unsubscribePgClient = [];

    // etc
    let isLoading = true;
    let jwt;
    let loginMbrId; // 로그인ID


    // 진료정보
    let mpayId = 0; // 결제ID
    let dgnsInfo = {};  // 진료정보
    let amt = 0; // 거래금액
    let pgReg = false;  // pg 등록 여부
    let hsptBank = [];  // 병원 은행명
    let hsptBankNull = true;    // 병원 계좌번호
    let pgType = null;  // PG구분
    let moduleList = [];

    // PG 결제정보
    let payInfo = {};
    let isPayLoading = false;
    let billingPayPopUp = false;

    // 결제수단 관리
    let swiper;
    const defaultPayMthd = "0";   // 간편결제:0, 일반결제:1
    let selectedPayMthd = defaultPayMthd;   // 선택한 결제수단
    let selectedPlst;   // 선택한 결제수단 정보
    let plstList = [];  // 결제수단 리스트





    // 진료정보 초기화
    async function initDgnsInfo(dgnsClient, dgnsId) {
        await dgnsClient.initDgnsInfo(dgnsId)
        unsubscribeDgnsClient = [
            dgnsClient.dgnsInfo.subscribe(value => { dgnsInfo = value; }),
            dgnsClient.pgReg.subscribe(value => { pgReg = value; }),
            dgnsClient.hsptBank.subscribe(value => { hsptBank = value; }),
            dgnsClient.hsptBankNull.subscribe(value => { hsptBankNull = value; }),
            dgnsClient.amt.subscribe(value => { amt = value; }),
            dgnsClient.mpayId.subscribe(value => { mpayId = value; }),
            dgnsClient.pgType.subscribe(value => { pgType = value; }),
            dgnsClient.moduleList.subscribe(value => { moduleList = value; }),
        ]
    }

    // PG Client 초기화
    async function initPgClient() {
        if (pgType === "01") {
            pgClient = useSmartroPay;
        } else if (pgType === "02") {
            pgClient = useAllthatPay;
        } else {
            pgClient = null;
        }
    }

    // PG 결제정보 초기화
    async function initPayInfo(pgClient, amt, mpayId, loginMbrId, dgnsInfo, userType) {
        await pgClient.initPayment(amt, mpayId, loginMbrId, dgnsInfo, userType);
        unsubscribePgClient = [
            pgClient.isLoading.subscribe(value => { isPayLoading = value; }),
            pgClient.payInfo.subscribe(value => { payInfo = value; }),
            pgClient.plstList.subscribe(value => { plstList = value; }),
        ]
    }



    // Swiper 슬라이드가 변경될 때마다 호출되는 함수
    function handleSlideChange() {
        const activeSlideIndex = swiper.activeIndex;
        selectedPlst = plstList[activeSlideIndex]; // 현재 슬라이드의 아이템 값 가져오기
    }

    // swiper 초기화
    function initSwiper() {
        swiper = new Swiper(".swiper-container", {
            // direction: 'vertical', // 슬라이드 방향을 수평으로 설정
            slidesPerView: "2", // 보여지는 슬라이드 개수 설정
            spaceBetween: 10, // 슬라이드 간 간격 설정
            centeredSlides: true, // 선택된 슬라이드를 가운데로 정렬
            loop: false, // 무한 루프 설정
            watchOverflow: true,
            slideToClickedSlide: true, // 해당 슬라이드 클릭시 슬라이드 위치로 이동
            on: {
                slideChange: handleSlideChange,
            },
            // pagination: {
            //     el: '.swiper-pagination', // 페이징 요소
            //     clickable: true // 페이징 요소 클릭 가능 여부
            // }
        });
        handleSlideChange();
    }

    // 초기화
    async function initMount() {
        jwtCheck();

        // 진료정보 초기화
        try {
            await initDgnsInfo(dgnsClient, dgnsId);
        } catch (error) {
            console.error("Error dgnsInfo initialize:", error);
        }

        // PG결제정보 초기화
        try {
            // pg 정보 및 결제수단 가져오기
            await dgnsClient.getPayEnv();
            // pg 세팅
            await initPgClient();
            if (dgnsInfo.mpayStat !== 5 && pgReg) {
                await initPayInfo(pgClient, amt, mpayId, loginMbrId, dgnsInfo, userType);
            }
        } catch (error) {
            console.error("Error payInfo initialize:", error);
        }

        // swiper 초기화
        initSwiper();
        isLoading = false;
    }

    onMount(() => {
        initMount();
    });

    onDestroy(() => {
        unsubscribeDgnsClient.forEach(fn => fn());  // 모든 구독 해제
        unsubscribePgClient.forEach(fn => fn());  // 모든 구독 해제
    });

    async function jwtCheck() {
        jwt = localStorage.getItem("userJwt");
        const refresh = localStorage.getItem("refreshJwt");
        try {
            //사용자 id를 가져온다.
            await getUserId(jwt).then(async (result) => {
                loginMbrId = result;
            });
        } catch (err) {
            //에러가 토큰기간만료 코드라면 다시 재발급을 진행
            try {
                if (err.message == "21009") {
                    await updateRefresh(refresh);
                } else {
                    //아니라면 그냥 에러 출력.
                    console.error(err);
                }
            } catch (err) {
                //토큰 재발급 과정에서 에러 발생 시, 다시 로그인하도록 로그인 화면으로 보낸다.
                console.error(err);
                localStorage.setItem("refreshJwt", "");
                localStorage.setItem("userJwt", "");
                alert("토큰 재발급 오류 발생. 다시 로그인해주세요");
                $isLogin = false;
                // goto("/mbr/uaLogin");
            }
        }
    }

    // 팝업 열기
    function popupOn() {
        billingPayPopUp = true;
    }

    // 팝업 닫기
    function popupOff() {
        billingPayPopUp = false;
    }

    // 결제여부확인 및 결제수단확인
    function goPayCheck() {
        dgnsClient.isPayValidation()
            .then(() => {
                if (selectedPayMthd === "1") goPay();
                else popupOn();
            })
            .catch(() => {
                initMount();
            });
    }

    // 일반결제
    async function goPay() {
        isLoading = true;
        await pgClient.goPayToStd();
        await initDgnsInfo(dgnsClient, dgnsId);
        isLoading = false;
    }

    // 빌링결제 (간편결제)
    async function goPayToBln() {
        isLoading = true;
        popupOff();
        await pgClient.goPayToBln(selectedPlst.id);
        await initMount();
    }

</script>

<!--<svelte:head>-->
<!--    &lt;!&ndash; 스마트로pay &ndash;&gt;-->
<!--    <script>-->
<!--        function smartroSrc() {-->
<!--            var today = new Date();-->
<!--            var year = today.getFullYear();-->
<!--            var month = ("0" + (today.getMonth() + 1)).slice(-2);-->
<!--            var day = ("0" + today.getDate()).slice(-2);-->
<!--            return "https://tpay.smartropay.co.kr/asset/js/SmartroPAY-1.0.min.js?version=" + year + month + day;-->
<!--        }-->
<!--    </script>-->
<!--    <meta name="author" content="Smartro"/>-->
<!--    &lt;!&ndash;  <script src="https://tmpay.smartropay.co.kr/asset/js/SmartroPAY-1.0.min.js?version=20231212"></script>&ndash;&gt;-->
<!--</svelte:head>-->

<section class="contents pay">
    <PayInfo {dgnsInfo} {amt}></PayInfo>
    {#if dgnsInfo.mpayStat !== 5}
        <PayMethod bind:selectedPayMthd {userType} {moduleList} {pgReg} {initSwiper} {plstList} {hsptBankNull}
                   {hsptBank}></PayMethod>
    {/if}
    <!-- 결제하기 버튼 -->
    {#if pgReg || dgnsInfo.mpayStat === 5}
        <Payment {dgnsInfo} {amt} {isPayLoading} {goPayCheck} {userType}></Payment>
    {/if}

</section>

{#if billingPayPopUp}
    <PayPopUp {popupOff} {goPayToBln}></PayPopUp>
{/if}

<!-- PageLoader -->
{#if isLoading}
    <PageLoader/>
{/if}
