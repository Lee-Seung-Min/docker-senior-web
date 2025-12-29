<script >
  // @ts-nocheck
    // type DgnsInfo = {
    //     shpNam: String
    //     deptNam: String
    //     dgnsPay: String
    // }

    export let dgnsInfo;
    export let amt;
</script>

<div class="box_1">
    <dl class="info_dl">
        <dt>병원명</dt>
        <dd>{dgnsInfo?.shpNam}</dd>
        <dt>진료과</dt>
        <dd>{dgnsInfo?.deptNam}</dd>
        <dt>진료비</dt>
        <dd>{dgnsInfo?.dgnsPay}원</dd>
        <dt>결제 금액</dt>
        <dd>{amt}원</dd>
    </dl>
</div>