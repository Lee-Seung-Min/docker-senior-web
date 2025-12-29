<script>
    // @ts-nocheck

    import {onMount} from "svelte";
    import {goto} from "$app/navigation";
    import {browser} from "$app/environment";
    import GuestNav from "$lib/sub/nav/guest/GuestNav.svelte";
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    const member = '0';
    const guest = '1';

    let count = 5;
    const countdown = setInterval(() => {
        if (browser) {
            count--;
            if (count <= 0) {
                clearInterval(countdown);
                moveResultPage();
            }
        }
    }, 1000);

    const moveResultPage = (() => {
        const params = get(page).url.searchParams;
        const payType = params.get("payType");
        const memberType = params.get("mbrType");
        if (payType === "H" && memberType === member) {
            // 회원 진료
            const dgnsId = params.get("id");
            goto("/pay/uaMbrDgns?dgnsId=" + dgnsId);
        } else if (payType === "H" && memberType === guest) {
            // 비회원 진료
            const guestToken = params.get("gstTkn");
            goto("/pay/uaGstDgns?guest=" + guestToken);
        } else if (payType === "D" && memberType === member) {
            // 회원 처방
            goto("/");
        } else if (payType === "D" && memberType === guest) {
            // 비회원 처방
            goto("/");
        } else {
            // default
            goto("/");
        }
    })

    onMount(async () => {
        countdown;
    })

</script>

<section>
    <div style="text-align: center; margin: 10px 0">
        <p>{count}초 후 페이지를 이동합니다.</p>
    </div>
</section>