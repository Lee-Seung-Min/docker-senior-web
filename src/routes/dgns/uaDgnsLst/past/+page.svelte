<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import Nav from "$lib/sub/nav/Nav.svelte";
  import { goto } from "$app/navigation";
  import { urlList } from "$lib/urlList";
  import DgnsLst from "../DgnsLst.svelte";
  import { chngDateFormat, getMonthAgo, getYesterDay } from "$lib/js/dateFunction";
  let dateFrom = "";
  let dateTo = "";
  let lstType = "";
  onMount(async () => {
    let yesterDay = getYesterDay();
    dateTo = chngDateFormat(yesterDay);
    let monthAgo = getMonthAgo();
    dateFrom = chngDateFormat(monthAgo);
    lstType = "past";
  });
</script>

<Nav
  >진료 목록
  <div class="dgnstab_wrap" slot="btns">
    <button
      type="button"
      on:click={() => {
        goto(urlList.uaDgnsLst);
      }}>진행 진료</button
    >
    <button type="button" class="on">지난 진료</button>
  </div>
</Nav>
<DgnsLst {dateFrom} {dateTo} {lstType}></DgnsLst>
