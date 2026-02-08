<script>
  import { createEventDispatcher } from 'svelte';
  import { themes, currentTheme, nodes, addNode, deleteNode, designStyle } from './stores';

  export let node;
  export let x = 0;
  export let y = 0;

  const dispatch = createEventDispatcher();

  let textInput;
  let editedText = node.text;
  let selectedColorIndex = node.colorIndex;
  let editedConnections = [...node.connections];
  let newConnectionId = '';
  let newNodeText = '';

  $: availableColors = $designStyle === 'brutalist'
    ? themes[$currentTheme].brutalistColors
    : $designStyle === 'vintage'
    ? themes[$currentTheme].vintageColors
    : themes[$currentTheme].modernColors;
  $: allNodes = $nodes;

  function getNodeById(id) {
    return allNodes.find(n => n.id === id);
  }

  function handleSave() {
    dispatch('save', {
      text: editedText.trim() || node.text,
      colorIndex: selectedColorIndex,
      connections: editedConnections
    });
  }

  function addConnection() {
    const id = parseInt(newConnectionId);
    if (isNaN(id) || id === node.id) {
      return; // Invalid ID or trying to connect to self
    }

    const targetNode = getNodeById(id);
    if (!targetNode) {
      return; // Node doesn't exist
    }

    if (!editedConnections.includes(id)) {
      editedConnections = [...editedConnections, id];
    }
    newConnectionId = '';
  }

  function removeConnection(id) {
    editedConnections = editedConnections.filter(connId => connId !== id);
  }

  function handleConnectionKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addConnection();
    }
  }

  function createNewNode() {
    if (!newNodeText.trim()) {
      return;
    }

    // Get the next ID that will be assigned
    const nextId = Math.max(...allNodes.map(n => n.id)) + 1;

    // Create node near the current node with some offset
    const offsetX = Math.random() * 200 - 100;
    const offsetY = Math.random() * 200 - 100;
    const newX = node.x + offsetX;
    const newY = node.y + offsetY;

    // Add connection to the new node
    addNode(newNodeText.trim(), newX, newY, 80, [node.id]);

    // Add the new node to this node's connections
    if (!editedConnections.includes(nextId)) {
      editedConnections = [...editedConnections, nextId];
    }

    newNodeText = '';
  }

  function handleNewNodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      createNewNode();
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  function handleDelete() {
    if (confirm(`Delete node "${node.text}"?`)) {
      deleteNode(node.id);
      dispatch('close');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }

  function selectColor(index) {
    selectedColorIndex = index;
  }

  // Focus input on mount
  import { onMount } from 'svelte';
  onMount(() => {
    if (textInput) {
      textInput.focus();
      textInput.select();
    }
  });
</script>

<div class="menu-backdrop" on:click={handleCancel} role="presentation">
  <div
    class="menu"
    class:modern={$designStyle === 'modern'}
    class:vintage={$designStyle === 'vintage'}
    style="left: {x}px; top: {y}px;"
    on:click|stopPropagation
    role="dialog"
  >
    <div class="menu-header">
      <div>
        <h4>Edit Node</h4>
        <span class="node-id">ID: {node.id}</span>
      </div>
      <button class="close-btn" on:click={handleCancel} aria-label="Close">×</button>
    </div>

    <div class="menu-content">
      <div class="field">
        <label for="node-text">Text</label>
        <input
          id="node-text"
          type="text"
          bind:this={textInput}
          bind:value={editedText}
          on:keydown={handleKeyDown}
          placeholder="Enter text..."
        />
      </div>

      <div class="field">
        <label>Color</label>
        <div class="color-grid">
          {#each availableColors as color, index}
            <button
              class="color-swatch"
              class:selected={selectedColorIndex === index}
              style="background-color: {color};"
              on:click={() => selectColor(index)}
              aria-label="Color {index + 1}"
            />
          {/each}
        </div>
      </div>

      <div class="field">
        <label>Connections</label>
        <div class="connections-list">
          {#if editedConnections.length === 0}
            <p class="no-connections">No connections</p>
          {:else}
            {#each editedConnections as connId}
              {@const connectedNode = getNodeById(connId)}
              <div class="connection-item">
                <span class="connection-info">
                  ID {connId}: {connectedNode ? connectedNode.text : 'Unknown'}
                </span>
                <button
                  class="remove-btn"
                  on:click={() => removeConnection(connId)}
                  aria-label="Remove connection"
                >
                  ×
                </button>
              </div>
            {/each}
          {/if}
        </div>
        <div class="add-connection">
          <input
            type="number"
            bind:value={newConnectionId}
            on:keydown={handleConnectionKeyDown}
            placeholder="Enter node ID..."
            min="1"
          />
          <button class="btn-add" on:click={addConnection}>Add</button>
        </div>
      </div>

      <div class="field">
        <label>Create</label>
        <div class="add-connection">
          <input
            type="text"
            bind:value={newNodeText}
            on:keydown={handleNewNodeKeyDown}
            placeholder="Enter new node text..."
          />
          <button class="btn-add" on:click={createNewNode}>Create</button>
        </div>
        <p class="helper-text">Creates a connected node near this one</p>
      </div>

      <div class="menu-actions">
        <button class="btn btn-secondary" on:click={handleCancel}>Cancel</button>
        <button class="btn btn-danger" on:click={handleDelete}>Delete</button>
        <button class="btn btn-primary" on:click={handleSave}>Save</button>
      </div>
    </div>
  </div>
</div>

<style>
  .menu-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu {
    position: absolute;
    background: #000;
    color: #fff;
    border: 6px solid #fff;
    box-shadow: 12px 12px 0 rgba(0, 0, 0, 0.5);
    min-width: 350px;
    max-width: 450px;
    transform: translate(-50%, -50%);
    animation: none;
  }

  .menu.modern {
    background: white;
    color: #333;
    border: none;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    min-width: 300px;
    max-width: 400px;
    animation: menuAppear 0.2s ease-out;
  }

  .menu.vintage {
    background: #F5EDE0;
    color: #3D2817;
    border: 3px solid #8B7355;
    border-radius: 4px;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
    min-width: 320px;
    max-width: 420px;
    animation: menuAppear 0.2s ease-out;
  }

  @keyframes menuAppear {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 4px solid #fff;
    background: #fff;
    color: #000;
  }

  .modern .menu-header {
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
    background: transparent;
  }

  .vintage .menu-header {
    padding: 16px 18px;
    border-bottom: 2px solid #8B7355;
    background: rgba(196, 165, 105, 0.2);
  }

  .menu-header h4 {
    margin: 0;
    font-size: 18px;
    color: #000;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: bold;
  }

  .modern .menu-header h4 {
    font-size: 16px;
    text-transform: none;
    letter-spacing: 0;
    color: #333;
  }

  .vintage .menu-header h4 {
    font-size: 17px;
    text-transform: none;
    letter-spacing: 0.5px;
    color: #3D2817;
    font-family: 'Georgia', serif;
  }

  .node-id {
    font-size: 11px;
    color: #666;
    font-weight: bold;
    text-transform: uppercase;
  }

  .modern .node-id {
    text-transform: none;
    color: #999;
    font-weight: normal;
  }

  .vintage .node-id {
    text-transform: none;
    color: #7A6A5A;
    font-weight: normal;
    font-style: italic;
  }

  .close-btn {
    background: #000;
    color: #fff;
    border: 3px solid #000;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-weight: bold;
  }

  .modern .close-btn {
    background: none;
    border: none;
    color: #999;
    width: 24px;
    height: 24px;
  }

  .vintage .close-btn {
    background: #C4A569;
    border: 2px solid #8B7355;
    color: #3D2817;
    width: 28px;
    height: 28px;
    border-radius: 3px;
  }

  .close-btn:hover {
    background: #fff;
    color: #000;
    border-color: #000;
  }

  .modern .close-btn:hover {
    background: none;
    color: #333;
  }

  .vintage .close-btn:hover {
    background: #A68A52;
  }

  .menu-content {
    padding: 20px;
  }

  .field {
    margin-bottom: 20px;
  }

  .field:last-of-type {
    margin-bottom: 0;
  }

  label {
    display: inline-block;
    font-size: 13px;
    font-weight: bold;
    color: #000;
    background: #fff;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 5px 10px;
  }

  .modern label {
    display: block;
    font-size: 12px;
    color: #555;
    background: none;
    padding: 0;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .vintage label {
    display: block;
    font-size: 13px;
    color: #3D2817;
    background: none;
    padding: 0;
    letter-spacing: 0.3px;
    margin-bottom: 8px;
    font-family: 'Georgia', serif;
  }

  input[type="text"] {
    width: 100%;
    padding: 12px;
    border: 3px solid #fff;
    background: #000;
    color: #fff;
    font-size: 14px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .modern input[type="text"] {
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    color: #333;
    font-family: inherit;
    font-weight: normal;
    transition: border-color 0.2s;
  }

  .vintage input[type="text"] {
    padding: 10px 12px;
    border: 2px solid #8B7355;
    border-radius: 3px;
    background: #FEFBF7;
    color: #3D2817;
    font-family: 'Georgia', serif;
    font-weight: normal;
  }

  input[type="text"]::placeholder,
  input[type="number"]::placeholder {
    color: #555;
  }

  .modern input[type="text"]::placeholder,
  .modern input[type="number"]::placeholder {
    color: #999;
  }

  .vintage input[type="text"]::placeholder,
  .vintage input[type="number"]::placeholder {
    color: #9B8B7B;
    font-style: italic;
  }

  input[type="text"]:focus,
  input[type="number"]:focus {
    outline: none;
    background: #fff;
    color: #000;
  }

  .modern input[type="text"]:focus,
  .modern input[type="number"]:focus {
    border-color: #667eea;
  }

  .vintage input[type="text"]:focus,
  .vintage input[type="number"]:focus {
    border-color: #6B5437;
  }

  input[type="number"] {
    width: 100%;
    padding: 10px;
    border: 3px solid #fff;
    background: #000;
    color: #fff;
    font-size: 14px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .modern input[type="number"] {
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    color: #333;
    font-family: inherit;
    font-weight: normal;
    transition: border-color 0.2s;
  }

  .vintage input[type="number"] {
    padding: 8px 12px;
    border: 2px solid #8B7355;
    border-radius: 3px;
    background: #FEFBF7;
    color: #3D2817;
    font-family: 'Georgia', serif;
    font-weight: normal;
  }

  .connections-list {
    background: #000;
    border: 3px solid #fff;
    padding: 10px;
    margin-bottom: 10px;
    max-height: 150px;
    overflow-y: auto;
  }

  .modern .connections-list {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .no-connections {
    color: #666;
    font-size: 13px;
    text-align: center;
    margin: 0;
    padding: 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .modern .no-connections {
    color: #999;
    text-transform: none;
    letter-spacing: 0;
  }

  .connection-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #fff;
    color: #000;
    border: 2px solid #000;
    margin-bottom: 8px;
  }

  .modern .connection-item {
    padding: 8px 10px;
    background: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 6px;
    transition: background 0.2s;
  }

  .connection-item:last-child {
    margin-bottom: 0;
  }

  .connection-item:hover {
    background: #000;
    color: #fff;
    border-color: #fff;
  }

  .modern .connection-item:hover {
    background: #f0f0f0;
    color: #333;
  }

  .connection-info {
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .modern .connection-info {
    font-size: 13px;
    font-weight: normal;
    text-transform: none;
  }

  .remove-btn {
    background: #000;
    color: #fff;
    border: 3px solid #fff;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  .modern .remove-btn {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    transition: background 0.2s;
  }

  .remove-btn:hover {
    background: #fff;
    color: #000;
    border-color: #000;
  }

  .modern .remove-btn:hover {
    background: #cc0000;
  }

  .add-connection {
    display: flex;
    gap: 8px;
  }

  .add-connection input {
    flex: 1;
  }

  .btn-add {
    padding: 10px 16px;
    background: #fff;
    color: #000;
    border: 3px solid #fff;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
  }

  .modern .btn-add {
    padding: 8px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    text-transform: none;
    letter-spacing: 0;
    transition: background 0.2s;
  }

  .vintage .btn-add {
    padding: 8px 16px;
    background: #C4A569;
    color: #3D2817;
    border: 2px solid #8B7355;
    border-radius: 3px;
    font-size: 13px;
    font-family: 'Georgia', serif;
    text-transform: capitalize;
    letter-spacing: 0.3px;
  }

  .btn-add:hover {
    background: #000;
    color: #fff;
    box-shadow: 3px 3px 0 #fff;
    transform: translate(-1px, -1px);
  }

  .modern .btn-add:hover {
    background: #5568d3;
    box-shadow: none;
    transform: none;
  }

  .vintage .btn-add:hover {
    background: #A68A52;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  .helper-text {
    font-size: 10px;
    color: #888;
    margin-top: 8px;
    margin-bottom: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .modern .helper-text {
    font-size: 11px;
    color: #999;
    text-transform: none;
    letter-spacing: 0;
    margin-top: 6px;
  }

  .vintage .helper-text {
    font-size: 11px;
    color: #7A6A5A;
    text-transform: none;
    letter-spacing: 0.2px;
    margin-top: 6px;
    font-style: italic;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .modern .color-grid {
    gap: 8px;
  }

  .color-swatch {
    width: 100%;
    aspect-ratio: 1;
    border: 4px solid #000;
    cursor: pointer;
    transition: none;
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
  }

  .modern .color-swatch {
    border: 3px solid transparent;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
  }

  .color-swatch:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.5);
  }

  .modern .color-swatch:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .color-swatch.selected {
    border-color: #fff;
    box-shadow: 0 0 0 4px #000, 5px 5px 0 rgba(0, 0, 0, 0.5);
    transform: translate(-2px, -2px);
  }

  .modern .color-swatch.selected {
    border-color: white;
    box-shadow: 0 0 0 2px #333, 0 4px 12px rgba(0, 0, 0, 0.25);
    transform: scale(1.05);
  }

  .menu-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .modern .menu-actions {
    gap: 10px;
  }

  .btn {
    flex: 1;
    padding: 14px 20px;
    border: 3px solid #fff;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
  }

  .modern .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    text-transform: none;
    letter-spacing: 0;
    transition: all 0.2s;
  }

  .vintage .btn {
    padding: 10px 18px;
    border: 2px solid #8B7355;
    border-radius: 3px;
    font-size: 14px;
    font-family: 'Georgia', serif;
    text-transform: capitalize;
    letter-spacing: 0.3px;
  }

  .btn-secondary {
    background: #000;
    color: #fff;
  }

  .modern .btn-secondary {
    background: #f0f0f0;
    color: #666;
  }

  .vintage .btn-secondary {
    background: #E8DCC8;
    color: #3D2817;
  }

  .btn-secondary:hover {
    background: #fff;
    color: #000;
    box-shadow: 4px 4px 0 #fff;
    transform: translate(-2px, -2px);
  }

  .modern .btn-secondary:hover {
    background: #e0e0e0;
    box-shadow: none;
    transform: none;
  }

  .vintage .btn-secondary:hover {
    background: #D4C8B0;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.25);
    transform: translateY(-1px);
  }

  .btn-primary {
    background: #fff;
    color: #000;
  }

  .modern .btn-primary {
    background: #667eea;
    color: white;
  }

  .vintage .btn-primary {
    background: #C4A569;
    color: #3D2817;
  }

  .btn-primary:hover {
    background: #000;
    color: #fff;
    box-shadow: 4px 4px 0 #fff;
    transform: translate(-2px, -2px);
  }

  .modern .btn-primary:hover {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .vintage .btn-primary:hover {
    background: #A68A52;
    transform: translateY(-1px);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  }

  .btn-danger {
    background: #FF0000;
    color: #fff;
  }

  .modern .btn-danger {
    background: #ff4444;
    color: white;
  }

  .vintage .btn-danger {
    background: #C84B31;
    color: #fff;
  }

  .btn-danger:hover {
    background: #CC0000;
    color: #fff;
    box-shadow: 4px 4px 0 #FF0000;
    transform: translate(-2px, -2px);
  }

  .modern .btn-danger:hover {
    background: #cc0000;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
  }

  .vintage .btn-danger:hover {
    background: #A33D27;
    transform: translateY(-1px);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
  }
</style>
