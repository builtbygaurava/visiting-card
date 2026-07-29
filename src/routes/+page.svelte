<script lang="ts">
  import { toPng } from 'html-to-image';

  let prompt = $state('');
  let loading = $state(false);
  let cardData = $state<any>(null);
  let error = $state('');
  let logoBase64 = $state('');
  let showBackground = $state(true);
  let activeSide = $state<'front' | 'back'>('front');

  // Front background
  let bgType = $state('solid');
  let gradientColor2 = $state('#ffffff');
  let patternType = $state('dots');
  let bgImageBase64 = $state('');

  // Back background
  let backBgType = $state('pattern');
  let backGradientColor2 = $state('#000000');
  let backPatternType = $state('moroccan');
  let backBgImageBase64 = $state('');
  let backPrimaryColor = $state('#1a1a1a');
  let backSecondaryColor = $state('#F59E0B');

  // Back card content
  let backWebsite = $state('');
  let backEmail = $state('');
  let backSocial = $state('');
  let backTagline = $state('');

  let positions = $state({
    logo: { x: 0, y: 0 },
    name: { x: 0, y: 0 },
    title: { x: 0, y: 0 },
    company: { x: 0, y: 0 },
    tagline: { x: 0, y: 0 },
    phone: { x: 0, y: 0 },
  });

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
        if (!validFonts.includes(data.font)) data.font = 'Nunito';
        if (!data.phone || data.phone === '+1 (555) 000-0000') {
          const phoneMatch = prompt.match(/(\+?\d[\d\s\-().]{7,})/);
          data.phone = phoneMatch ? phoneMatch[0].trim() : '';
        }
        cardData = data;
        backPrimaryColor = data.primaryColor;
        backSecondaryColor = data.secondaryColor;
        backTagline = data.tagline || '';
        positions = { logo: { x: 0, y: 0 }, name: { x: 0, y: 0 }, title: { x: 0, y: 0 }, company: { x: 0, y: 0 }, tagline: { x: 0, y: 0 }, phone: { x: 0, y: 0 } };
        setTimeout(initDraggable, 100);
      }
    } catch (err) {
      error = 'Something went wrong. Try again.';
    } finally {
      loading = false;
    }
  }

  async function initDraggable() {
    const interact = (await import('interactjs')).default;
    const elements = ['logo', 'name', 'title', 'company', 'tagline', 'phone'];
    elements.forEach((id) => {
      const el = document.getElementById(`drag-${id}`);
      if (!el) return;
      interact(el).draggable({
        listeners: {
          move(event: any) {
            positions[id as keyof typeof positions].x += event.dx;
            positions[id as keyof typeof positions].y += event.dy;
            event.target.style.transform = `translate(${positions[id as keyof typeof positions].x}px, ${positions[id as keyof typeof positions].y}px)`;
          }
        }
      });
    });
  }

  function getSvgPattern(type: string, color: string): string {
    const c = encodeURIComponent(color);
    const patterns: Record<string, string> = {
      dots: `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><circle cx='6' cy='6' r='2' fill='${c}'/></svg>`,
      lines: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><line x1='0' y1='0' x2='20' y2='20' stroke='${c}' stroke-width='1'/></svg>`,
      grid: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><path d='M 20 0 L 0 0 0 20' fill='none' stroke='${c}' stroke-width='0.5'/></svg>`,
      hexagons: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='32'><polygon points='14,1 27,8 27,24 14,31 1,24 1,8' fill='none' stroke='${c}' stroke-width='1'/></svg>`,
      waves: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12'><path d='M0 6 Q10 0 20 6 Q30 12 40 6' fill='none' stroke='${c}' stroke-width='1.5'/></svg>`,
      triangles: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><polygon points='10,2 18,18 2,18' fill='${c}'/></svg>`,
      stripes: `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><line x1='0' y1='10' x2='10' y2='0' stroke='${c}' stroke-width='2'/></svg>`,
      circles: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='12' cy='12' r='8' fill='none' stroke='${c}' stroke-width='2'/></svg>`,
      zigzag: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12'><polyline points='0,12 10,0 20,12 30,0 40,12' fill='none' stroke='${c}' stroke-width='1.5'/></svg>`,
      circuit: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect x='18' y='18' width='4' height='4' fill='${c}'/><line x1='0' y1='20' x2='18' y2='20' stroke='${c}' stroke-width='1'/><line x1='22' y1='20' x2='40' y2='20' stroke='${c}' stroke-width='1'/><line x1='20' y1='0' x2='20' y2='18' stroke='${c}' stroke-width='1'/><line x1='20' y1='22' x2='20' y2='40' stroke='${c}' stroke-width='1'/><circle cx='0' cy='20' r='2' fill='${c}'/><circle cx='40' cy='20' r='2' fill='${c}'/><circle cx='20' cy='0' r='2' fill='${c}'/><circle cx='20' cy='40' r='2' fill='${c}'/></svg>`,
      mesh: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><line x1='0' y1='0' x2='20' y2='40' stroke='${c}' stroke-width='0.8'/><line x1='20' y1='0' x2='40' y2='40' stroke='${c}' stroke-width='0.8'/><line x1='40' y1='0' x2='20' y2='40' stroke='${c}' stroke-width='0.8'/><line x1='0' y1='0' x2='40' y2='20' stroke='${c}' stroke-width='0.8'/></svg>`,
      cross: `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect x='8' y='2' width='4' height='16' fill='${c}'/><rect x='2' y='8' width='16' height='4' fill='${c}'/></svg>`,
      diamond: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><polygon points='12,2 22,12 12,22 2,12' fill='none' stroke='${c}' stroke-width='1.5'/><polygon points='12,6 18,12 12,18 6,12' fill='${c}' opacity='0.4'/></svg>`,
      moroccan: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><polygon points='16,2 20,10 30,10 22,16 26,26 16,20 6,26 10,16 2,10 12,10' fill='${c}'/></svg>`,
      grain: `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='5' cy='8' r='1.2' fill='${c}'/><circle cx='15' cy='3' r='0.8' fill='${c}'/><circle cx='28' cy='12' r='1.4' fill='${c}'/><circle cx='38' cy='5' r='1' fill='${c}'/><circle cx='10' cy='20' r='1.1' fill='${c}'/><circle cx='22' cy='25' r='1.5' fill='${c}'/><circle cx='35' cy='22' r='0.8' fill='${c}'/><circle cx='3' cy='32' r='1.2' fill='${c}'/><circle cx='18' cy='38' r='1' fill='${c}'/><circle cx='30' cy='35' r='1.4' fill='${c}'/></svg>`,
      leaf: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M4,28 Q16,4 28,4 Q28,16 4,28Z' fill='${c}' opacity='0.7'/><line x1='4' y1='28' x2='22' y2='10' stroke='${c}' stroke-width='0.8'/></svg>`,
      stars: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><polygon points='16,4 17.5,13 26,13 19,18 22,27 16,22 10,27 13,18 6,13 14.5,13' fill='${c}'/></svg>`,
      starburst: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><polygon points='16,2 17,14 28,8 19,16 28,24 17,18 16,30 15,18 4,24 13,16 4,8 15,14' fill='${c}'/></svg>`,
      fishscale: `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30'><path d='M0,30 Q15,15 30,30' fill='none' stroke='${c}' stroke-width='1.5'/><path d='M-15,15 Q0,0 15,15' fill='none' stroke='${c}' stroke-width='1.5'/><path d='M15,15 Q30,0 45,15' fill='none' stroke='${c}' stroke-width='1.5'/></svg>`,
      concentric: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><polygon points='16,2 22,10 30,10 24,18 26,28 16,24 6,28 8,18 2,10 10,10' fill='none' stroke='${c}' stroke-width='1'/><polygon points='16,8 20,13 25,13 21,17 23,23 16,20 9,23 11,17 7,13 12,13' fill='${c}' opacity='0.5'/></svg>`,
      pinwheel: `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><path d='M16,16 Q24,8 28,16 Q24,24 16,16Z' fill='${c}'/><path d='M16,16 Q8,24 16,28 Q24,24 16,16Z' fill='${c}' opacity='0.7'/><path d='M16,16 Q8,8 4,16 Q8,24 16,16Z' fill='${c}' opacity='0.5'/><path d='M16,16 Q24,8 16,4 Q8,8 16,16Z' fill='${c}' opacity='0.3'/></svg>`,
    };
    const svg = patterns[type] || patterns.dots;
    return `url("data:image/svg+xml,${svg}")`;
  }

  function getBackgroundStyle(type: string, primary: string, gradient2: string, pattern: string, image: string, show: boolean) {
    if (!show) return 'background: transparent;';
    const patternColor = primary + '88';
    switch (type) {
      case 'gradient':
        return `background: linear-gradient(135deg, ${primary}, ${gradient2});`;
      case 'pattern':
        return `background-color: ${primary}; background-image: ${getSvgPattern(pattern, patternColor)};`;
      case 'image':
        if (image) return `background: url(${image}) center/cover no-repeat;`;
        return `background: ${primary};`;
      default:
        return `background: ${primary};`;
    }
  }

  function getFrontStyle() {
    return getBackgroundStyle(bgType, cardData?.primaryColor || '#000', gradientColor2, patternType, bgImageBase64, showBackground);
  }

  function getBackStyle() {
    return getBackgroundStyle(backBgType, backPrimaryColor, backGradientColor2, backPatternType, backBgImageBase64, true);
  }

  function handleLogoUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { logoBase64 = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  function handleBgImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { bgImageBase64 = ev.target?.result as string; bgType = 'image'; };
    reader.readAsDataURL(file);
  }

  function handleBackBgImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { backBgImageBase64 = ev.target?.result as string; backBgType = 'image'; };
    reader.readAsDataURL(file);
  }

  async function downloadCard() {
    const id = activeSide === 'front' ? 'card-preview-front' : 'card-preview-back';
    const card = document.getElementById(id);
    if (!card) return;
    try {
      const dataUrl = await toPng(card, {
        pixelRatio: 3,
        style: { borderRadius: '16px', transform: 'none', margin: '0' }
      });
      const link = document.createElement('a');
      link.download = `visiting-card-${activeSide}.png`;
      link.href = dataUrl;
      link.click();
    } catch(err) {
      console.error('Download failed:', err);
    }
  }

  async function downloadBoth() {
    for (const side of ['front', 'back'] as const) {
      const id = side === 'front' ? 'card-preview-front' : 'card-preview-back';
      const card = document.getElementById(id);
      if (!card) continue;
      try {
        const dataUrl = await toPng(card, { pixelRatio: 3, style: { borderRadius: '16px', transform: 'none', margin: '0' } });
        const link = document.createElement('a');
        link.download = `visiting-card-${side}.png`;
        link.href = dataUrl;
        link.click();
        await new Promise(r => setTimeout(r, 500));
      } catch(err) {
        console.error(`Download ${side} failed:`, err);
      }
    }
  }

  const allPatterns = ['dots', 'lines', 'grid', 'hexagons', 'waves', 'triangles', 'stripes', 'circles', 'zigzag', 'circuit', 'mesh', 'cross', 'diamond', 'moroccan', 'grain', 'leaf', 'stars', 'starburst', 'fishscale', 'concentric', 'pinwheel'];
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2" class="mb-3">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M7 8h4M7 12h8M7 16h5"/>
            </svg>
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
          <!-- Front/Back toggle -->
          <div class="flex gap-2 mb-4 rounded-xl p-1" style="background: #161616; border: 1px solid #2A2A2A;">
            <button
              onclick={() => activeSide = 'front'}
              class="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style="background: {activeSide === 'front' ? '#F59E0B' : 'transparent'}; color: {activeSide === 'front' ? '#111111' : '#6B6B6B'};"
            >
              Front
            </button>
            <button
              onclick={() => activeSide = 'back'}
              class="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style="background: {activeSide === 'back' ? '#F59E0B' : 'transparent'}; color: {activeSide === 'back' ? '#111111' : '#6B6B6B'};"
            >
              Back
            </button>
          </div>

          <!-- FRONT card -->
          {#if activeSide === 'front'}
          <div class="relative" style="filter: drop-shadow(0 25px 50px rgba(245,158,11,0.15));">
            <div
              id="card-preview-front"
              class="w-96 rounded-2xl overflow-hidden relative"
              style="{getFrontStyle()} font-family: '{cardData.font}', sans-serif; min-height: 224px; transform: rotate(-1deg); border: {showBackground ? 'none' : '1px dashed #3A3A3A'};"
            >
              <div class="relative w-full h-full" style="min-height: 224px; padding: 32px;">
                {#if logoBase64}
                  <div id="drag-logo" class="absolute cursor-move inline-block" style="top: 24px; left: 24px; touch-action: none;">
                    <img src={logoBase64} alt="Logo" class="h-10 w-10 object-contain rounded" />
                  </div>
                {/if}
                <div id="drag-name" class="absolute cursor-move" style="top: {logoBase64 ? '80px' : '24px'}; left: 24px; touch-action: none;">
                  <h2 contenteditable="true" bind:innerText={cardData.name} class="text-2xl font-bold outline-none" style="color: {cardData.secondaryColor};"></h2>
                </div>
                <div id="drag-title" class="absolute cursor-move" style="top: {logoBase64 ? '116px' : '64px'}; left: 24px; touch-action: none;">
                  <p contenteditable="true" bind:innerText={cardData.title} class="text-sm outline-none opacity-80" style="color: {cardData.secondaryColor};"></p>
                </div>
                <div id="drag-company" class="absolute cursor-move" style="bottom: 48px; left: 24px; touch-action: none;">
                  <p contenteditable="true" bind:innerText={cardData.company} class="font-semibold outline-none" style="color: {cardData.secondaryColor};"></p>
                </div>
                <div id="drag-tagline" class="absolute cursor-move" style="bottom: 28px; left: 24px; touch-action: none;">
                  <p contenteditable="true" bind:innerText={cardData.tagline} class="text-xs italic outline-none opacity-70" style="color: {cardData.secondaryColor};"></p>
                </div>
                {#if cardData.phone}
                  <div id="drag-phone" class="absolute cursor-move" style="bottom: 10px; left: 24px; touch-action: none;">
                    <p contenteditable="true" bind:innerText={cardData.phone} class="text-xs outline-none opacity-80" style="color: {cardData.secondaryColor};"></p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
          <p class="text-xs mt-4" style="color: #3A3A3A;">✦ Drag elements · Click text to edit</p>
          {/if}

          <!-- BACK card -->
          {#if activeSide === 'back'}
          <div class="relative" style="filter: drop-shadow(0 25px 50px rgba(245,158,11,0.15));">
            <div
              id="card-preview-back"
              class="w-96 rounded-2xl overflow-hidden relative flex flex-col items-center justify-center"
              style="{getBackStyle()} font-family: '{cardData.font}', sans-serif; min-height: 224px; transform: rotate(1deg);"
            >
              <div class="flex flex-col items-center justify-center w-full h-full p-8 text-center" style="min-height: 224px;">
                {#if logoBase64}
                  <img src={logoBase64} alt="Logo" class="h-12 w-12 object-contain rounded mb-4" />
                {/if}
                <p contenteditable="true" bind:innerText={backTagline} class="text-sm font-semibold outline-none mb-3" style="color: {backSecondaryColor}; min-width: 20px;"></p>
                {#if backWebsite}
                  <p class="text-xs outline-none opacity-80 mb-1" style="color: {backSecondaryColor};">🌐 {backWebsite}</p>
                {/if}
                {#if backEmail}
                  <p class="text-xs outline-none opacity-80 mb-1" style="color: {backSecondaryColor};">✉️ {backEmail}</p>
                {/if}
                {#if backSocial}
                  <p class="text-xs outline-none opacity-80" style="color: {backSecondaryColor};">@ {backSocial}</p>
                {/if}
              </div>
            </div>
          </div>
          <p class="text-xs mt-4" style="color: #3A3A3A;">✦ Designing back of card</p>
          {/if}

        {/if}
      </div>

      <!-- RIGHT: Controls -->
      <div class="space-y-4">

        <div>
          <label class="block text-xs font-medium mb-2 uppercase tracking-widest" style="color: #6B6B6B;">Describe your card</label>
          <textarea
            bind:value={prompt}
            placeholder="Try: Modern minimal card for Alex Kumar, CEO at Nexus Labs, +91 98765 43210"
            rows="4"
            class="w-full rounded-xl text-sm resize-none"
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
        <div class="space-y-3">
          <p class="text-xs font-medium uppercase tracking-widest pt-2" style="color: #6B6B6B;">
            Customize — {activeSide === 'front' ? 'Front' : 'Back'}
          </p>

          {#if activeSide === 'front'}
          <!-- FRONT controls -->
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

          <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Background Type</p>
            <div class="grid grid-cols-4 gap-2 mb-3">
              {#each ['solid', 'gradient', 'pattern', 'image'] as type}
                <button onclick={() => bgType = type} class="text-xs py-1.5 rounded-lg capitalize font-medium" style="background: {bgType === type ? '#F59E0B' : '#2A2A2A'}; color: {bgType === type ? '#111111' : '#F5F2EE'};">{type}</button>
              {/each}
            </div>
            {#if bgType === 'solid'}
              <div class="flex items-center gap-2">
                <span class="text-xs" style="color: #6B6B6B;">Color:</span>
                <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                <button onclick={() => showBackground = !showBackground} class="text-xs px-2 py-1 rounded-lg ml-auto" style="background: {showBackground ? '#F59E0B22' : '#2A2A2A'}; color: {showBackground ? '#F59E0B' : '#6B6B6B'}; border: 1px solid {showBackground ? '#F59E0B44' : '#3A3A3A'};">{showBackground ? '✓ Visible' : '✗ Hidden'}</button>
              </div>
            {/if}
            {#if bgType === 'gradient'}
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-xs" style="color: #6B6B6B;">Color 1:</span>
                <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                <span class="text-xs" style="color: #6B6B6B;">Color 2:</span>
                <input type="color" bind:value={gradientColor2} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
              </div>
            {/if}
            {#if bgType === 'pattern'}
              <div class="space-y-2">
                <div class="grid grid-cols-3 gap-1.5">
                  {#each allPatterns as p}
                    <button onclick={() => patternType = p} class="text-xs px-1 py-1 rounded-lg capitalize text-center" style="background: {patternType === p ? '#F59E0B' : '#2A2A2A'}; color: {patternType === p ? '#111111' : '#F5F2EE'}; font-size: 10px;">{p}</button>
                  {/each}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs" style="color: #6B6B6B;">Base:</span>
                  <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </div>
            {/if}
            {#if bgType === 'image'}
              <div>
                <label for="bg-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg inline-block" style="background: #2A2A2A; color: #F5F2EE;">{bgImageBase64 ? 'Change image' : 'Upload image'}</label>
                <input id="bg-upload" type="file" accept="image/*" onchange={handleBgImageUpload} class="hidden" />
                {#if bgImageBase64}<button onclick={() => { bgImageBase64 = ''; bgType = 'solid'; }} class="text-xs ml-2" style="color: #EF4444;">Remove</button>{/if}
              </div>
            {/if}
          </div>

          <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Logo (optional)</p>
            <div class="flex items-center gap-2">
              <label for="logo-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background: #2A2A2A; color: #F5F2EE;">Upload logo</label>
              <input id="logo-upload" type="file" accept="image/*" onchange={handleLogoUpload} class="hidden" />
              {#if logoBase64}
                <button onclick={() => logoBase64 = ''} class="text-xs px-2 py-1.5 rounded-lg" style="background: #3A1515; color: #EF4444;">Remove</button>
              {:else}
                <span class="text-xs" style="color: #3A3A3A;">No file selected</span>
              {/if}
            </div>
          </div>
          {/if}

          {#if activeSide === 'back'}
          <!-- BACK controls -->
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Back Color</p>
              <input type="color" bind:value={backPrimaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Text Color</p>
              <input type="color" bind:value={backSecondaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
          </div>

          <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Back Background Type</p>
            <div class="grid grid-cols-4 gap-2 mb-3">
              {#each ['solid', 'gradient', 'pattern', 'image'] as type}
                <button onclick={() => backBgType = type} class="text-xs py-1.5 rounded-lg capitalize font-medium" style="background: {backBgType === type ? '#F59E0B' : '#2A2A2A'}; color: {backBgType === type ? '#111111' : '#F5F2EE'};">{type}</button>
              {/each}
            </div>
            {#if backBgType === 'solid'}
              <div class="flex items-center gap-2">
                <span class="text-xs" style="color: #6B6B6B;">Color:</span>
                <input type="color" bind:value={backPrimaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
              </div>
            {/if}
            {#if backBgType === 'gradient'}
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-xs" style="color: #6B6B6B;">Color 1:</span>
                <input type="color" bind:value={backPrimaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                <span class="text-xs" style="color: #6B6B6B;">Color 2:</span>
                <input type="color" bind:value={backGradientColor2} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
              </div>
            {/if}
            {#if backBgType === 'pattern'}
              <div class="space-y-2">
                <div class="grid grid-cols-3 gap-1.5">
                  {#each allPatterns as p}
                    <button onclick={() => backPatternType = p} class="text-xs px-1 py-1 rounded-lg capitalize text-center" style="background: {backPatternType === p ? '#F59E0B' : '#2A2A2A'}; color: {backPatternType === p ? '#111111' : '#F5F2EE'}; font-size: 10px;">{p}</button>
                  {/each}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs" style="color: #6B6B6B;">Base:</span>
                  <input type="color" bind:value={backPrimaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent" />
                </div>
              </div>
            {/if}
            {#if backBgType === 'image'}
              <div>
                <label for="back-bg-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg inline-block" style="background: #2A2A2A; color: #F5F2EE;">{backBgImageBase64 ? 'Change image' : 'Upload image'}</label>
                <input id="back-bg-upload" type="file" accept="image/*" onchange={handleBackBgImageUpload} class="hidden" />
                {#if backBgImageBase64}<button onclick={() => { backBgImageBase64 = ''; backBgType = 'solid'; }} class="text-xs ml-2" style="color: #EF4444;">Remove</button>{/if}
              </div>
            {/if}
          </div>

          <!-- Back content fields -->
          <div class="rounded-xl p-3 space-y-2" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Back Card Content</p>
            <input bind:value={backWebsite} placeholder="Website (e.g. www.nexuslabs.com)" class="w-full text-xs rounded-lg px-3 py-2 outline-none" style="background: #2A2A2A; color: #F5F2EE; border: 1px solid #3A3A3A;" />
            <input bind:value={backEmail} placeholder="Email (e.g. alex@nexuslabs.com)" class="w-full text-xs rounded-lg px-3 py-2 outline-none" style="background: #2A2A2A; color: #F5F2EE; border: 1px solid #3A3A3A;" />
            <input bind:value={backSocial} placeholder="Social handle (e.g. @nexuslabs)" class="w-full text-xs rounded-lg px-3 py-2 outline-none" style="background: #2A2A2A; color: #F5F2EE; border: 1px solid #3A3A3A;" />
          </div>
          {/if}

          <!-- Download buttons -->
          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={downloadCard}
              class="py-3 rounded-xl font-semibold text-sm"
              style="background: #161616; color: #F59E0B; border: 1px solid #3A2E1A; font-family: 'Nunito', sans-serif;"
            >
              ↓ This side
            </button>
            <button
              onclick={downloadBoth}
              class="py-3 rounded-xl font-semibold text-sm"
              style="background: #F59E0B; color: #111111; font-family: 'Nunito', sans-serif;"
            >
              ↓ Both sides
            </button>
          </div>
        </div>
        {/if}

      </div>
    </div>
  </main>
</div>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
  textarea::placeholder { color: #3A3A3A; }
  textarea:focus { border-color: #F59E0B !important; }
  select option { background: #161616; color: #F5F2EE; }
  [id^="drag-"] { user-select: none; }
  [id^="drag-"]:hover { outline: 1px dashed rgba(245,158,11,0.4); outline-offset: 4px; border-radius: 4px; }
</style>