<script>
  import { animationEnabled, resetPositions, themes, currentTheme, setTheme, showIds, addNode, zoomLevel, panOffset, nodes, designStyle } from './stores';

  let newNodeText = '';
  let pasteInput = '';
  let isCollapsed = false;

  $: mapState = {
    nodes: $nodes,
    theme: $currentTheme,
    designStyle: $designStyle,
    zoomLevel: $zoomLevel,
    panOffset: $panOffset,
    animationEnabled: $animationEnabled,
    showIds: $showIds
  };

  $: jsonOutput = JSON.stringify(mapState, null, 2);

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }

  function toggleAnimation() {
    animationEnabled.update(value => !value);
  }

  function toggleShowIds() {
    showIds.update(value => !value);
  }

  function handleReset() {
    resetPositions();
  }

  function handleThemeChange(themeName) {
    setTheme(themeName);
  }

  function zoomIn() {
    zoomLevel.update(zoom => Math.min(3, zoom + 0.2));
  }

  function zoomOut() {
    zoomLevel.update(zoom => Math.max(0.1, zoom - 0.2));
  }

  function resetView() {
    zoomLevel.set(1);
    panOffset.set({ x: 0, y: 0 });
  }

  function createFreeNode() {
    if (!newNodeText.trim()) {
      return;
    }

    // Create node at center with small random offset
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const offsetX = Math.random() * 100 - 50;
    const offsetY = Math.random() * 100 - 50;

    addNode(newNodeText.trim(), centerX + offsetX, centerY + offsetY);
    newNodeText = '';
  }

  function handleNewNodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      createFreeNode();
    }
  }

  function loadFromJSON() {
    if (!pasteInput.trim()) {
      return;
    }

    try {
      const state = JSON.parse(pasteInput);

      // Validate and load state
      if (state.nodes && Array.isArray(state.nodes)) {
        nodes.set(state.nodes);
      }
      if (state.theme && themes[state.theme]) {
        currentTheme.set(state.theme);
      }
      if (state.designStyle && (state.designStyle === 'brutalist' || state.designStyle === 'modern' || state.designStyle === 'vintage')) {
        designStyle.set(state.designStyle);
      }
      if (typeof state.zoomLevel === 'number') {
        zoomLevel.set(state.zoomLevel);
      }
      if (state.panOffset && typeof state.panOffset.x === 'number' && typeof state.panOffset.y === 'number') {
        panOffset.set(state.panOffset);
      }
      if (typeof state.animationEnabled === 'boolean') {
        animationEnabled.set(state.animationEnabled);
      }
      if (typeof state.showIds === 'boolean') {
        showIds.set(state.showIds);
      }

      pasteInput = '';
      alert('Map state loaded successfully!');
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
    }
  }

  function setDesignStyle(style) {
    designStyle.set(style);
  }

  function handleWheel(e) {
    // Stop scroll from propagating to the map (which would zoom)
    e.stopPropagation();
  }
</script>

<div class="controls" class:modern={$designStyle === 'modern'} class:vintage={$designStyle === 'vintage'} class:collapsed={isCollapsed} on:wheel={handleWheel}>
  <div class="controls-header">
    <div>
      <h3>Interactive Mindmap</h3>
      {#if !isCollapsed}
        <p>Drag to move, double-click for menu, scroll to resize!</p>
      {/if}
    </div>
    <button class="toggle-btn" on:click={toggleCollapse} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
      {isCollapsed ? '▶' : '◀'}
    </button>
  </div>

  {#if !isCollapsed}
  <div class="controls-content">

  <div class="section">
    <h4>Design</h4>
    <div class="theme-buttons">
      <button
        class="theme-btn"
        class:active={$designStyle === 'brutalist'}
        on:click={() => setDesignStyle('brutalist')}
      >
        BRUTALIST
      </button>
      <button
        class="theme-btn"
        class:active={$designStyle === 'modern'}
        on:click={() => setDesignStyle('modern')}
      >
        MODERN
      </button>
      <button
        class="theme-btn"
        class:active={$designStyle === 'vintage'}
        on:click={() => setDesignStyle('vintage')}
      >
        VINTAGE
      </button>
    </div>
  </div>

  <div class="section">
    <h4>{$designStyle === 'brutalist' ? 'Theme' : 'Color'}</h4>
    <div class="theme-buttons">
      {#each Object.keys(themes) as themeName}
        <button
          class="theme-btn"
          class:active={$currentTheme === themeName}
          on:click={() => handleThemeChange(themeName)}
        >
          {themes[themeName].name}
        </button>
      {/each}
    </div>
  </div>

  <div class="section">
    <h4>Visuals</h4>
    <div class="buttons">
      <button on:click={toggleShowIds}>
        {$showIds ? 'Hide IDs' : 'Show IDs'}
      </button>
    </div>
  </div>

  <div class="section">
    <h4>Create</h4>
    <div class="create-input">
      <input
        type="text"
        bind:value={newNodeText}
        on:keydown={handleNewNodeKeyDown}
        placeholder="Enter text..."
      />
      <button on:click={createFreeNode}>Create Node</button>
    </div>
  </div>

  <div class="section">
    <h4>View</h4>
    <div class="zoom-controls">
      <button on:click={zoomOut}>−</button>
      <span class="zoom-level">{Math.round($zoomLevel * 100)}%</span>
      <button on:click={zoomIn}>+</button>
    </div>
    <button on:click={resetView} style="width: 100%; margin-top: 5px;">Reset View</button>
  </div>

  <div class="section">
    <h4>Controls</h4>
    <div class="buttons">
      <button on:click={handleReset}>Reset Positions</button>
      <button on:click={toggleAnimation}>Toggle Float</button>
    </div>
  </div>

  <div class="section">
    <h4>JSON</h4>
    <label class="json-label">Current</label>
    <textarea
      class="json-output"
      readonly
      value={jsonOutput}
      on:click={(e) => e.target.select()}
    />
    <label class="json-label">Paste</label>
    <textarea
      class="json-output"
      bind:value={pasteInput}
      placeholder="Paste JSON here..."
    />
    <button on:click={loadFromJSON} style="width: 100%; margin-top: 5px;">Load State</button>
  </div>
  </div>
  {/if}
</div>

<style>
  .controls {
    position: fixed;
    top: 20px;
    left: 20px;
    background: #000;
    color: #fff;
    padding: 20px;
    border: 5px solid #fff;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
    z-index: 1000;
    max-width: 320px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    transition: all 0.3s ease;
  }

  .controls.collapsed {
    width: auto;
    max-width: none;
    padding: 0;
    border: none;
    box-shadow: none;
    background: transparent;
  }

  .controls.modern.collapsed,
  .controls.vintage.collapsed {
    background: transparent;
    box-shadow: none;
    border: none;
  }

  .controls.modern {
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    border: none;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  }

  .controls.vintage {
    background: #F5EDE0;
    color: #3D2817;
    border: 2px solid #8B7355;
    border-radius: 4px;
    box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.25);
  }

  h3 {
    margin-bottom: 15px;
    color: #fff;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 3px solid #fff;
    padding-bottom: 10px;
  }

  .modern h3 {
    color: #333;
    font-size: 18px;
    text-transform: none;
    letter-spacing: 0;
    border-bottom: 1px solid #e0e0e0;
  }

  .vintage h3 {
    color: #3D2817;
    font-size: 19px;
    text-transform: none;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #8B7355;
    font-family: 'Georgia', serif;
  }

  p {
    font-size: 11px;
    color: #fff;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .modern p {
    font-size: 12px;
    color: #666;
    text-transform: none;
    letter-spacing: 0;
    margin-bottom: 10px;
  }

  .vintage p {
    font-size: 11px;
    color: #5C4A3A;
    text-transform: none;
    letter-spacing: 0.3px;
    margin-bottom: 12px;
    font-style: italic;
  }

  .section {
    margin-bottom: 20px;
    border: 3px solid #fff;
    padding: 12px;
  }

  .modern .section {
    border: none;
    padding: 0;
    margin-bottom: 15px;
  }

  .vintage .section {
    border: 1px solid #B8956A;
    padding: 10px;
    margin-bottom: 15px;
    background: rgba(255, 255, 255, 0.3);
  }

  .section:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 13px;
    color: #fff;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    background: #fff;
    color: #000;
    padding: 5px 8px;
    display: inline-block;
  }

  .modern h4 {
    font-size: 12px;
    color: #555;
    background: none;
    padding: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .vintage h4 {
    font-size: 13px;
    color: #3D2817;
    background: none;
    padding: 0;
    text-transform: capitalize;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    font-family: 'Georgia', serif;
  }

  .buttons,
  .theme-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  button {
    background: #fff;
    color: #000;
    border: 3px solid #000;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.1s;
    font-family: 'Courier New', monospace;
  }

  .modern button {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 8px 15px;
    text-transform: none;
    letter-spacing: 0;
    font-family: 'Segoe UI', sans-serif;
    transition: all 0.2s;
  }

  .vintage button {
    background: #C4A569;
    color: #3D2817;
    border: 2px solid #8B7355;
    border-radius: 3px;
    padding: 8px 14px;
    text-transform: capitalize;
    letter-spacing: 0.5px;
    font-family: 'Georgia', serif;
    transition: all 0.15s;
  }

  button:hover {
    background: #000;
    color: #fff;
    border-color: #fff;
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 #fff;
  }

  .modern button:hover {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: none;
  }

  .vintage button:hover {
    background: #A68A52;
    transform: translateY(-1px);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  button:active {
    transform: translate(0, 0);
    box-shadow: none;
  }

  .theme-btn.active {
    background: #fff;
    color: #000;
    box-shadow: inset 0 0 0 3px #000;
  }

  .modern .theme-btn.active {
    background: #333;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .vintage .theme-btn.active {
    background: #8B7355;
    color: #F5EDE0;
    box-shadow: inset 0 0 0 2px #5C4A3A;
  }

  .create-input {
    display: flex;
    gap: 8px;
  }

  .create-input input {
    flex: 1;
    padding: 10px;
    border: 3px solid #fff;
    background: #000;
    color: #fff;
    font-size: 12px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }

  .modern .create-input input {
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    background: #fff;
    color: #333;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .vintage .create-input input {
    padding: 8px 12px;
    border: 2px solid #8B7355;
    border-radius: 3px;
    background: #FEFBF7;
    color: #3D2817;
    font-family: 'Georgia', serif;
  }

  .create-input input:focus {
    outline: none;
    background: #fff;
    color: #000;
  }

  .modern .create-input input:focus {
    border-color: #667eea;
  }

  .vintage .create-input input:focus {
    border-color: #6B5437;
    background: #FFF;
  }

  .create-input input::placeholder {
    color: #666;
  }

  .vintage .create-input input::placeholder {
    color: #9B8B7B;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zoom-controls button {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .zoom-level {
    font-size: 14px;
    color: #fff;
    font-weight: bold;
    min-width: 50px;
    text-align: center;
    background: #fff;
    color: #000;
    padding: 8px;
  }

  .modern .zoom-level {
    font-size: 12px;
    color: #666;
    background: none;
    min-width: 45px;
    padding: 0;
  }

  .vintage .zoom-level {
    font-size: 13px;
    color: #3D2817;
    background: #C4A569;
    border: 1px solid #8B7355;
    min-width: 48px;
    padding: 6px;
    border-radius: 3px;
    font-family: 'Georgia', serif;
  }

  .json-label {
    display: block;
    font-size: 11px;
    color: #000;
    background: #fff;
    margin-bottom: 8px;
    margin-top: 12px;
    font-weight: bold;
    padding: 5px 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .modern .json-label {
    font-size: 11px;
    color: #666;
    background: none;
    padding: 0;
    margin-top: 10px;
    margin-bottom: 5px;
  }

  .vintage .json-label {
    font-size: 12px;
    color: #3D2817;
    background: none;
    padding: 0;
    margin-top: 10px;
    margin-bottom: 6px;
    font-family: 'Georgia', serif;
    font-style: italic;
  }

  .json-label:first-of-type {
    margin-top: 0;
  }

  .json-output {
    width: 100%;
    height: 120px;
    padding: 10px;
    border: 3px solid #fff;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    line-height: 1.4;
    resize: vertical;
    background: #000;
    color: #0f0;
    overflow-y: auto;
    font-weight: bold;
  }

  .modern .json-output {
    height: 150px;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    background: #f9f9f9;
    color: #333;
    font-weight: normal;
    transition: border-color 0.2s;
  }

  .vintage .json-output {
    height: 130px;
    border: 2px solid #8B7355;
    border-radius: 3px;
    background: #FEFBF7;
    color: #3D2817;
    font-weight: normal;
  }

  .json-output:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px #0f0;
  }

  .modern .json-output:focus {
    border-color: #667eea;
    box-shadow: none;
  }

  .vintage .json-output:focus {
    border-color: #6B5437;
    box-shadow: none;
  }

  .json-output::placeholder {
    color: #0a0;
  }

  .modern .json-output::placeholder {
    color: #999;
  }

  .vintage .json-output::placeholder {
    color: #9B8B7B;
  }

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .controls.collapsed .controls-header {
    margin-bottom: 0;
  }

  .controls.collapsed .controls-header > div {
    display: none;
  }

  .controls-header > div {
    flex: 1;
  }

  .toggle-btn {
    background: #fff;
    color: #000;
    border: 3px solid #000;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    min-width: 40px;
    margin-left: 10px;
    flex-shrink: 0;
  }

  .controls.collapsed .toggle-btn {
    margin-left: 0;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  }

  .controls.modern.collapsed .toggle-btn {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .controls.vintage.collapsed .toggle-btn {
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  }

  .modern .toggle-btn {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 6px 10px;
  }

  .vintage .toggle-btn {
    background: #C4A569;
    color: #3D2817;
    border: 2px solid #8B7355;
    border-radius: 3px;
    padding: 6px 10px;
  }

  .toggle-btn:hover {
    background: #000;
    color: #fff;
    border-color: #fff;
    transform: none;
    box-shadow: none;
  }

  .modern .toggle-btn:hover {
    background: #5568d3;
    transform: none;
  }

  .vintage .toggle-btn:hover {
    background: #A68A52;
    transform: none;
  }

  .controls-content {
    overflow-y: auto;
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    .controls {
      top: 10px;
      left: 10px;
      max-width: calc(100vw - 20px);
      width: calc(100vw - 20px);
      padding: 15px;
      max-height: calc(100vh - 20px);
    }

    .controls.collapsed {
      width: auto;
      max-width: none;
      padding: 0;
    }

    h3 {
      font-size: 16px;
    }

    .modern h3 {
      font-size: 15px;
    }

    .vintage h3 {
      font-size: 16px;
    }

    p {
      font-size: 10px;
    }

    button {
      padding: 8px 12px;
      font-size: 11px;
    }

    .modern button {
      padding: 7px 12px;
      font-size: 11px;
    }

    .vintage button {
      padding: 7px 12px;
      font-size: 11px;
    }

    .section {
      margin-bottom: 15px;
      padding: 10px;
    }

    .json-output {
      height: 100px;
    }

    .modern .json-output {
      height: 120px;
    }

    .vintage .json-output {
      height: 110px;
    }
  }

  @media (max-width: 480px) {
    .controls {
      padding: 12px;
    }

    h3 {
      font-size: 14px;
      margin-bottom: 10px;
    }

    .modern h3 {
      font-size: 14px;
    }

    .vintage h3 {
      font-size: 14px;
    }

    p {
      font-size: 9px;
      margin-bottom: 10px;
    }

    button {
      padding: 6px 10px;
      font-size: 10px;
    }

    .modern button {
      padding: 6px 10px;
      font-size: 10px;
    }

    .vintage button {
      padding: 6px 10px;
      font-size: 10px;
    }

    .section {
      margin-bottom: 12px;
      padding: 8px;
    }

    .zoom-controls button {
      width: 35px;
      height: 35px;
      font-size: 20px;
    }

    .json-output {
      height: 80px;
      font-size: 9px;
    }

    .toggle-btn {
      padding: 6px 8px;
      font-size: 14px;
      min-width: 35px;
    }
  }

  @media (max-height: 600px) {
    .controls {
      max-height: calc(100vh - 20px);
    }

    .json-output {
      height: 80px;
    }

    .modern .json-output {
      height: 100px;
    }

    .vintage .json-output {
      height: 90px;
    }
  }

  /* Custom scrollbar styling */
  .controls {
    scrollbar-width: thin;
    scrollbar-color: #fff #000;
  }

  .controls.modern {
    scrollbar-color: #667eea rgba(0, 0, 0, 0.1);
  }

  .controls.vintage {
    scrollbar-color: #8B7355 #E8DCC8;
  }

  /* Webkit browsers (Chrome, Safari, Edge) */
  .controls::-webkit-scrollbar {
    width: 12px;
  }

  .controls::-webkit-scrollbar-track {
    background: #000;
    border-left: 3px solid #fff;
  }

  .controls::-webkit-scrollbar-thumb {
    background: #fff;
    border: 2px solid #000;
  }

  .controls::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }

  .controls.modern::-webkit-scrollbar {
    width: 10px;
  }

  .controls.modern::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-left: none;
    border-radius: 10px;
  }

  .controls.modern::-webkit-scrollbar-thumb {
    background: #667eea;
    border: none;
    border-radius: 10px;
  }

  .controls.modern::-webkit-scrollbar-thumb:hover {
    background: #5568d3;
  }

  .controls.vintage::-webkit-scrollbar {
    width: 10px;
  }

  .controls.vintage::-webkit-scrollbar-track {
    background: #E8DCC8;
    border-left: 1px solid #8B7355;
  }

  .controls.vintage::-webkit-scrollbar-thumb {
    background: #C4A569;
    border: 1px solid #8B7355;
    border-radius: 3px;
  }

  .controls.vintage::-webkit-scrollbar-thumb:hover {
    background: #A68A52;
  }

  /* Custom scrollbar for json output */
  .json-output {
    scrollbar-width: thin;
    scrollbar-color: #0f0 #000;
  }

  .modern .json-output {
    scrollbar-color: #667eea rgba(0, 0, 0, 0.1);
  }

  .vintage .json-output {
    scrollbar-color: #8B7355 #FEFBF7;
  }

  .json-output::-webkit-scrollbar {
    width: 8px;
  }

  .json-output::-webkit-scrollbar-track {
    background: #000;
  }

  .json-output::-webkit-scrollbar-thumb {
    background: #0f0;
  }

  .json-output::-webkit-scrollbar-thumb:hover {
    background: #0c0;
  }

  .modern .json-output::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .modern .json-output::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 4px;
  }

  .modern .json-output::-webkit-scrollbar-thumb:hover {
    background: #5568d3;
  }

  .vintage .json-output::-webkit-scrollbar-track {
    background: #FEFBF7;
  }

  .vintage .json-output::-webkit-scrollbar-thumb {
    background: #C4A569;
    border-radius: 2px;
  }

  .vintage .json-output::-webkit-scrollbar-thumb:hover {
    background: #A68A52;
  }
</style>
