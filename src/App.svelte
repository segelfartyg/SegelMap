<script>
  import { onMount } from 'svelte';
  import { themedNodes, animationEnabled, editingNodeId, draggedNodeId, updateNodePosition, updateNodeSize, currentBackground, zoomLevel, panOffset, designStyle } from './lib/stores';
  import Node from './lib/Node.svelte';
  import Canvas from './lib/Canvas.svelte';
  import Controls from './lib/Controls.svelte';

  let animationTime = 0;
  let canvasComponent;
  let mainElement;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let spacePressed = false;

$: transform =
  `translate(${$panOffset.x}px, ${$panOffset.y}px) scale(${$zoomLevel})`;


  // Set design style on body
  $: {
    if (typeof document !== 'undefined') {
      document.body.className = $designStyle;
    }
  }

  // Animation loop
  onMount(() => {
    let animationFrameId;

    function animate() {
      if ($animationEnabled && !$draggedNodeId && !$editingNodeId) {
        animationTime += 0.01;
      }

      // Trigger canvas redraw
      if (canvasComponent) {
        canvasComponent.drawConnections($themedNodes);
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // Add keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  function handleNodeMove(event) {
    const { id, x, y } = event.detail;
    updateNodePosition(id, x, y);
  }

  function handleNodeResize(event) {
    const { id, size } = event.detail;
    updateNodeSize(id, size);
  }

  function handleWheel(e) {
    // Only zoom if not over a node
    if (e.target.closest('.node')) {
      return;
    }

    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel.update(zoom => Math.max(0.1, Math.min(3, zoom + delta)));
  }

  function handleMouseDown(e) {
    // Pan with middle mouse or space + left mouse
    if (e.button === 1 || (spacePressed && e.button === 0)) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - $panOffset.x;
      panStartY = e.clientY - $panOffset.y;
      mainElement.style.cursor = 'grabbing';
    }
  }

  function handleMouseMove(e) {
    if (isPanning) {
      panOffset.set({
        x: e.clientX - panStartX,
        y: e.clientY - panStartY
      });
    }
  }

  function handleMouseUp() {
    if (isPanning) {
      isPanning = false;
      mainElement.style.cursor = spacePressed ? 'grab' : 'default';
    }
  }

  function handleKeyDown(e) {
    if (e.code === 'Space' && !spacePressed && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      spacePressed = true;
      mainElement.style.cursor = 'grab';
    }
  }

  function handleKeyUp(e) {
    if (e.code === 'Space') {
      spacePressed = false;
      if (!isPanning) {
        mainElement.style.cursor = 'default';
      }
    }
  }
</script>

<main
  bind:this={mainElement}
  style="background: {$currentBackground}"
  on:wheel={handleWheel}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
>
  <div class="canvas-container" style="transform: {transform}">
    <Canvas bind:this={canvasComponent} />
    {#each $themedNodes as node (node.id)}
      <Node
        {node}
        animTime={animationTime}
        animEnabled={$animationEnabled}
        on:move={handleNodeMove}
        on:resize={handleNodeResize}
      />
    {/each}
  </div>

  <Controls />
</main>

<style>
  main {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    transition: background 0.5s ease;
  }

  .canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
    transform-origin: 0 0;
    transition: transform 0.1s ease-out;
  }
</style>
