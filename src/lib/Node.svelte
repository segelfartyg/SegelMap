<script>
  import { createEventDispatcher } from 'svelte';
  import { editingNodeId, draggedNodeId, updateNodeFull, showIds, designStyle } from './stores';
  import NodeMenu from './NodeMenu.svelte';

  export let node;
  export let animTime = 0;
  export let animEnabled = true;

  const dispatch = createEventDispatcher();

  let isEditing = false;
  let isDragging = false;
  let hasMoved = false;
  let offsetX = 0;
  let offsetY = 0;
  let nodeElement;
  let showMenu = false;
  let menuX = 0;
  let menuY = 0;

  // Reactive values
  $: isEditing = $editingNodeId === node.id;
  $: isDragging = $draggedNodeId === node.id;

  // Calculate animated position
  $: animatedX = animEnabled && !isDragging && !isEditing
    ? node.x + Math.sin(animTime + node.id) * 20
    : node.x;

  $: animatedY = animEnabled && !isDragging && !isEditing
    ? node.y + Math.cos(animTime + node.id * 0.5) * 20
    : node.y;

  function handleMouseDown(e) {
    if (isEditing) return;

    hasMoved = false;
    offsetX = e.clientX - node.x;
    offsetY = e.clientY - node.y;

    draggedNodeId.set(node.id);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if ($draggedNodeId === node.id) {
      hasMoved = true;
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      dispatch('move', { id: node.id, x: newX, y: newY });
    }
  }

  function handleMouseUp() {
    draggedNodeId.set(null);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function handleDoubleClick(e) {
    if (hasMoved) return;

    // Set menu position to the node's position
    menuX = node.x;
    menuY = node.y;
    showMenu = true;
    editingNodeId.set(node.id);
  }

  function handleMenuSave(event) {
    const { text, colorIndex, connections } = event.detail;
    updateNodeFull(node.id, text, colorIndex, connections);
    closeMenu();
  }

  function closeMenu() {
    showMenu = false;
    editingNodeId.set(null);
  }

  function handleWheel(e) {
    e.preventDefault();
    e.stopPropagation();

    // Determine size change based on scroll direction
    const delta = e.deltaY > 0 ? -5 : 5;
    const newSize = node.size + delta;

    dispatch('resize', { id: node.id, size: newSize });
  }
</script>

<div
  bind:this={nodeElement}
  class="node"
  class:modern={$designStyle === 'modern'}
  class:vintage={$designStyle === 'vintage'}
  class:dragging={isDragging}
  class:editing={isEditing}
  style="
    width: {node.size}px;
    height: {node.size}px;
    background-color: {node.color};
    left: {animatedX - node.size / 2}px;
    top: {animatedY - node.size / 2}px;
  "
  on:mousedown={handleMouseDown}
  on:dblclick={handleDoubleClick}
  on:wheel={handleWheel}
  role="button"
  tabindex="0"
>
  {node.text}{#if $showIds} ({node.id}){/if}
</div>

{#if showMenu}
  <NodeMenu
    {node}
    x={menuX}
    y={menuY}
    on:save={handleMenuSave}
    on:close={closeMenu}
  />
{/if}

<style>
  .node {
    position: absolute;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: move;
    user-select: none;
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);
    transition: none;
    padding: 20px;
    color: #000;
    font-weight: bold;
    font-size: 14px;
    z-index: 10;
    border: 4px solid #000;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .node.modern {
    border-radius: 50%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    color: white;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
  }

  .node.vintage {
    border-radius: 8px;
    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s;
    border: 2px solid rgba(0, 0, 0, 0.2);
    color: #F5EDE0;
    text-transform: none;
    letter-spacing: 0.3px;
    font-weight: normal;
    font-family: 'Georgia', serif;
  }

  .node:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.8);
  }

  .node.modern:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  .node.vintage:hover {
    transform: translateY(-2px);
    box-shadow: 4px 5px 10px rgba(0, 0, 0, 0.4);
  }

  .node.dragging {
    opacity: 0.9;
    transform: translate(-3px, -3px);
    box-shadow: 10px 10px 0 rgba(0, 0, 0, 0.8);
    z-index: 100;
  }

  .node.modern.dragging {
    opacity: 0.8;
    transform: scale(1.15);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  .node.vintage.dragging {
    opacity: 0.85;
    transform: translateY(-3px);
    box-shadow: 5px 7px 12px rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .node.editing {
    outline: 5px solid #000;
    outline-offset: 5px;
    z-index: 100;
  }

  .node.modern.editing {
    outline: 3px solid rgba(255, 255, 255, 0.8);
    outline-offset: 3px;
  }

  .node.vintage.editing {
    outline: 3px solid #8B7355;
    outline-offset: 3px;
  }
</style>
