<script>
  import { onMount} from 'svelte';
  import { nodes, designStyle } from './stores';

  let canvas;
  let ctx;

  onMount(() => {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  });

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  // Make canvas large enough for any reasonable mindmap
  // This ensures lines don't get clipped when zoomed out
  const canvasSize = 10000;

  canvas.width  = canvasSize * dpr;
  canvas.height = canvasSize * dpr;

  canvas.style.width  = canvasSize + 'px';
  canvas.style.height = canvasSize + 'px';
}

export function drawConnections(nodeList) {
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;

  // Reset transform and clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply only DPR scaling (world coords match node coords)
  ctx.scale(dpr, dpr);

  nodeList.forEach(node => {
    node.connections.forEach(targetId => {
      const targetNode = nodeList.find(n => n.id === targetId);
      if (!targetNode) return;

      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();
    });
  });
}

  // Reactively draw connections when nodes change
  $: drawConnections($nodes);
</script>

<canvas bind:this={canvas}/>

<style>
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
