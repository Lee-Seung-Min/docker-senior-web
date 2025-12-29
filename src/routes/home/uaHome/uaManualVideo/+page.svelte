<script>
  import Nav from "$lib/sub/nav/Nav.svelte";

  let videoUrl = "/lib/img/video/manualVideo.mp4";
</script>

<Nav />
<div class="video-container">
  <video controlsList="nodownload" controls>
    <source src={videoUrl} type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>

<style>
  video {
    width: 100%;
    height: auto;
    max-height: 100vh;
    transform-origin: center;
  }
  .video-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 132px); /* 화면 전체 높이 */
  }
</style>
