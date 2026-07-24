<script lang="ts">
  import { toPng } from 'html-to-image';

  let prompt = $state('');
  let loading = $state(false);
  let cardData = $state<any>(null);
  let error = $state('');
  let logoBase64 = $state('');
  let showBackground = $state(true);

  // Background options
  let bgType = $state('solid'); // solid | gradient | pattern | image
  let gradientColor2 = $state('#ffffff');
  let patternType = $state('dots'); // dots | lines | grid
  let bgImageBase64 = $state('');

  async function generateCard() {
    if (!prompt.trim()) return;
    loading = true;
    error = '';
    cardData = null;

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();

      if (data.error) {
        error = data.error;
      } else {
        const validFonts = ['Montserrat', 'Poppins', 'Playfair Display', 'Roboto', 'Oswald', 'Lora', 'Nunito', 'Inter'];
        if (!validFonts.includes(data.font)) {
          data.font = 'Nunito';
        }
        if (!data.phone || data.phone === '+1 (555) 000-0000') {
          const phoneMatch = prompt.match(/(\+?\d[\d\s\-().]{7,})/);
          data.phone = phoneMatch ? phoneMatch[0].trim() : '';
        }
        cardData = data;
      }
    } catch (err) {
      error = 'Something went wrong. Try again.';
    } finally {
      loading = false;
    }
  }

  function handleLogoUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      logoBase64 = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleBgImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      bgImageBase64 = ev.target?.result as string;
      bgType = 'image';
    };
    reader.readAsDataURL(file);
  }

  function getCardBackground() {
    if (!showBackground) return 'transparent';
    if (!cardData) return 'transparent';
    switch (bgType) {
      case 'gradient':
        return `linear-gradient(135deg, ${cardData.primaryColor}, ${gradientColor2})`;
      case 'pattern':
        if (patternType === 'dots') {
          return `radial-gradient(circle, ${cardData.secondaryColor}22 1px, transparent 1px), ${cardData.primaryColor}`;
        } else if (patternType === 'lines') {
          return `repeating-linear-gradient(45deg, ${cardData.secondaryColor}22 0px, ${cardData.secondaryColor}22 1px, transparent 1px, transparent 10px), ${cardData.primaryColor}`;
        } else {
          return `repeating-linear-gradient(0deg, ${cardData.secondaryColor}22 0px, ${cardData.secondaryColor}22 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${cardData.secondaryColor}22 0px, ${cardData.secondaryColor}22 1px, transparent 1px, transparent 20px), ${cardData.primaryColor}`;
        }
      case 'image':
        return bgImageBase64 ? `url(${bgImageBase64})` : cardData.primaryColor;
      default:
        return cardData.primaryColor;
    }
  }

  function getCardBackgroundStyle() {
    if (bgType === 'image' && bgImageBase64) {
      return `background: url(${bgImageBase64}) center/cover no-repeat;`;
    }
    if (bgType === 'pattern') {
      return `background: ${getCardBackground()}; background-size: ${patternType === 'dots' ? '12px 12px' : '20px 20px'};`;
    }
    return `background: ${getCardBackground()};`;
  }

  async function downloadCard() {
    const card = document.getElementById('card-preview');
    if (!card) return;
    try {
      const dataUrl = await toPng(card, {
        pixelRatio: 3,
        style: { borderRadius: '16px', transform: 'none', margin: '0' }
      });
      const link = document.createElement('a');
      link.download = 'visiting-card.png';
      link.href = dataUrl;
      link.click();
    } catch(err) {
      console.error('Download failed:', err);
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&family=Oswald:wght@400;700&family=Lora:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen" style="background: #111111; font-family: 'Nunito', sans-serif;">

  <header class="border-b" style="border-color: #1E1E1E;">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background: #F59E0B;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M7 8h4M7 12h8M7 16h5"/>
          </svg>
        </div>
        <span class="font-semibold text-sm tracking-tight" style="color: #F5F2EE; font-family: 'Nunito', sans-serif;">CardDeployer</span>
      </div>
      <span class="text-xs px-2 py-1 rounded-full" style="background: #1A1200; color: #F59E0B; border: 1px solid #3D2E00;">AI-powered</span>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-12">

    <div class="text-center mb-14">
      <h1 class="text-5xl font-bold mb-4 tracking-tight" style="color: #F5F2EE; font-family: 'Nunito', sans-serif; line-height: 1.1;">
        Your card, <span style="color: #F59E0B;">Just enter details and get your card! :)</span>
      </h1>
      <p class="text-base" style="color: #6B6B6B;">Describe your brand. Get a professional visiting card in seconds.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

      <!-- LEFT: Card Preview -->
      <div class="flex flex-col items-center justify-start pt-2">
        {#if !cardData && !loading}
          <div class="w-full aspect-[1.75] rounded-2xl flex flex-col items-center justify-center" style="background: #161616; border: 1px dashed #2A2A2A;">
            <div class="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style="background: #1E1E1E;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M7 8h4M7 12h8M7 16h5"/>
              </svg>
            </div>
            <p class="text-sm" style="color: #3A3A3A;">Your card preview will appear here</p>
          </div>
        {/if}

        {#if loading}
          <div class="w-full aspect-[1.75] rounded-2xl flex flex-col items-center justify-center" style="background: #161616; border: 1px solid #2A2A2A;">
            <div class="w-6 h-6 rounded-full border-2 mb-3" style="border-color: #F59E0B; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
            <p class="text-sm" style="color: #6B6B6B;">Crafting your card...</p>
          </div>
        {/if}

        {#if cardData}
          <div class="relative" style="filter: drop-shadow(0 25px 50px rgba(245,158,11,0.15));">
            <div
              id="card-preview"
              class="w-96 rounded-2xl p-8 flex flex-col justify-between overflow-hidden"
              style="{getCardBackgroundStyle()} font-family: '{cardData.font}', sans-serif; min-height: 224px; transform: rotate(-1deg); border: {showBackground ? 'none' : '1px dashed #3A3A3A'};"
            >
              <div>
                {#if logoBase64}
                  <img src={logoBase64} alt="Logo" class="h-10 w-10 object-contain mb-3 rounded" />
                {/if}
                <h2
                  contenteditable="true"
                  bind:innerText={cardData.name}
                  class="text-2xl font-bold outline-none rounded px-1 -mx-1"
                  style="color: {cardData.secondaryColor};"
                ></h2>
                <p
                  contenteditable="true"
                  bind:innerText={cardData.title}
                  class="text-sm mt-1 outline-none rounded px-1 -mx-1 opacity-80"
                  style="color: {cardData.secondaryColor};"
                ></p>
              </div>
              <div class="mt-4">
                <p
                  contenteditable="true"
                  bind:innerText={cardData.company}
                  class="font-semibold outline-none rounded px-1 -mx-1"
                  style="color: {cardData.secondaryColor};"
                ></p>
                <p
                  contenteditable="true"
                  bind:innerText={cardData.tagline}
                  class="text-xs italic mt-0.5 outline-none rounded px-1 -mx-1 opacity-70"
                  style="color: {cardData.secondaryColor};"
                ></p>
                {#if cardData.phone}
                  <p
                    contenteditable="true"
                    bind:innerText={cardData.phone}
                    class="text-xs mt-2 outline-none rounded px-1 -mx-1 opacity-80"
                    style="color: {cardData.secondaryColor};"
                  ></p>
                {/if}
              </div>
            </div>
          </div>
          <p class="text-xs mt-4" style="color: #3A3A3A;">Click any text on the card to edit it</p>
        {/if}
      </div>

      <!-- RIGHT: Controls -->
      <div class="space-y-5">

        <div>
          <label class="block text-xs font-medium mb-2 uppercase tracking-widest" style="color: #6B6B6B;">Describe your card</label>
          <textarea
            bind:value={prompt}
            placeholder="e.g. Minimal black and gold card for Ayush Tiwari, Founder at Aeternik, +91 9977889900"
            rows="4"
            class="w-full rounded-xl text-sm resize-none transition-all"
            style="background: #161616; border: 1px solid #2A2A2A; color: #F5F2EE; padding: 14px 16px; outline: none; font-family: 'Nunito', sans-serif;"
          ></textarea>
        </div>

        <button
          onclick={generateCard}
          disabled={loading}
          class="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
          style="background: {loading ? '#D97706' : '#F59E0B'}; color: #111111; font-family: 'Nunito', sans-serif;"
        >
          {loading ? '✦ Generating your card...' : '✦ Generate Card'}
        </button>

        {#if error}
          <p class="text-sm px-4 py-3 rounded-lg" style="background: #1A0A0A; color: #F87171; border: 1px solid #3A1515;">{error}</p>
        {/if}

        {#if cardData}
        <div class="pt-2 space-y-3">
          <p class="text-xs font-medium uppercase tracking-widest" style="color: #6B6B6B;">Customize</p>

          <!-- Text + Font -->
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Card Color</p>
              <input type="color" bind:value={cardData.primaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Text Color</p>
              <input type="color" bind:value={cardData.secondaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Font</p>
              <select bind:value={cardData.font} class="w-full text-xs rounded bg-transparent border-0 outline-none" style="color: #F5F2EE;">
                <option value="Nunito">Nunito</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Playfair Display">Playfair</option>
                <option value="Roboto">Roboto</option>
                <option value="Oswald">Oswald</option>
                <option value="Lora">Lora</option>
              </select>
            </div>
          </div>

          <!-- Background Type -->
          <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Background Type</p>
            <div class="grid grid-cols-4 gap-2">
              {#each ['solid', 'gradient', 'pattern', 'image'] as type}
                <button
                  onclick={() => bgType = type}
                  class="text-xs py-1.5 rounded-lg capitalize font-medium transition-all"
                  style="background: {bgType === type ? '#F59E0B' : '#2A2A2A'}; color: {bgType === type ? '#111111' : '#F5F2EE'};"
                >
                  {type}
                </button>
              {/each}
            </div>

            <!-- Solid options -->
            {#if bgType === 'solid'}
              <div class="mt-3 flex items-center gap-2">
                <span class="text-xs" style="color: #6B6B6B;">Color:</span>
                <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                <button
                  onclick={() => showBackground = !showBackground}
                  class="text-xs px-2 py-1 rounded-lg ml-auto"
                  style="background: {showBackground ? '#F59E0B22' : '#2A2A2A'}; color: {showBackground ? '#F59E0B' : '#6B6B6B'}; border: 1px solid {showBackground ? '#F59E0B44' : '#3A3A3A'};"
                >
                  {showBackground ? '✓ Visible' : '✗ Hidden'}
                </button>
              </div>
            {/if}

            <!-- Gradient options -->
            {#if bgType === 'gradient'}
              <div class="mt-3 flex items-center gap-3">
                <span class="text-xs" style="color: #6B6B6B;">Color 1:</span>
                <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                <span class="text-xs" style="color: #6B6B6B;">Color 2:</span>
                <input type="color" bind:value={gradientColor2} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
              </div>
            {/if}

            <!-- Pattern options -->
            {#if bgType === 'pattern'}
              <div class="mt-3 space-y-2">
                <div class="flex gap-2">
                  {#each ['dots', 'lines', 'grid'] as p}
                    <button
                      onclick={() => patternType = p}
                      class="text-xs px-3 py-1 rounded-lg capitalize"
                      style="background: {patternType === p ? '#F59E0B' : '#2A2A2A'}; color: {patternType === p ? '#111111' : '#F5F2EE'};"
                    >
                      {p}
                    </button>
                  {/each}
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs" style="color: #6B6B6B;">Base color:</span>
                  <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </div>
            {/if}

            <!-- Image upload -->
            {#if bgType === 'image'}
              <div class="mt-3">
                <label for="bg-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg inline-block" style="background: #2A2A2A; color: #F5F2EE;">
                  {bgImageBase64 ? 'Change image' : 'Upload image'}
                </label>
                <input id="bg-upload" type="file" accept="image/*" onchange={handleBgImageUpload} class="hidden" />
                {#if bgImageBase64}
                  <button onclick={() => { bgImageBase64 = ''; bgType = 'solid'; }} class="text-xs ml-2" style="color: #EF4444;">Remove</button>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Logo upload -->
          <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Logo (optional)</p>
            <div class="flex items-center gap-2">
              <label for="logo-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background: #2A2A2A; color: #F5F2EE;">
                Upload logo
              </label>
              <input id="logo-upload" type="file" accept="image/*" onchange={handleLogoUpload} class="hidden" />
              {#if logoBase64}
                <button onclick={() => logoBase64 = ''} class="text-xs px-2 py-1.5 rounded-lg" style="background: #3A1515; color: #EF4444;">Remove</button>
              {:else}
                <span class="text-xs" style="color: #3A3A3A;">No file selected</span>
              {/if}
            </div>
          </div>

          <!-- Download -->
          <button
            onclick={downloadCard}
            class="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style="background: #161616; color: #F59E0B; border: 1px solid #3A2E1A; font-family: 'Nunito', sans-serif;"
          >
            ↓ Download Card
          </button>
        </div>
        {/if}

      </div>

    </div>
  </main>
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  textarea::placeholder {
    color: #3A3A3A;
  }
  textarea:focus {
    border-color: #F59E0B !important;
  }
  select option {
    background: #161616;
    color: #F5F2EE;
  }
</style>