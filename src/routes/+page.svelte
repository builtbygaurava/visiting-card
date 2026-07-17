<script lang="ts">
  import { toPng } from 'html-to-image';
  import { storage, ID } from '$lib/appwrite';
  import { PUBLIC_APPWRITE_BUCKET_ID } from '$env/static/public';

  let prompt = $state('');
  let loading = $state(false);
  let cardData = $state<any>(null);
  let error = $state('');
  let logoUrl = $state('');
  let uploading = $state(false);

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
        const validFonts = ['Montserrat', 'Poppins', 'Playfair Display', 'Roboto', 'Oswald', 'Lora', 'Space Grotesk', 'Inter'];
        if (!validFonts.includes(data.font)) {
          data.font = 'Space Grotesk';
        }
        cardData = data;
      }
    } catch (err) {
      error = 'Something went wrong. Try again.';
    } finally {
      loading = false;
    }
  }

  async function handleLogoUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    try {
      const result = await storage.createFile({
        bucketId: PUBLIC_APPWRITE_BUCKET_ID,
        fileId: ID.unique(),
        file: file
      });
      const url = storage.getFileView({
        bucketId: PUBLIC_APPWRITE_BUCKET_ID,
        fileId: result.$id
      });
      logoUrl = url.toString();
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      uploading = false;
    }
  }

  async function downloadCard() {
    const card = document.getElementById('card-preview');
    if (!card) return;

    const logoImg = card.querySelector('img') as HTMLImageElement | null;
    if (logoImg) logoImg.style.display = 'none';

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
    } finally {
      if (logoImg) logoImg.style.display = '';
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&family=Oswald:wght@400;700&family=Lora:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen" style="background: #111111; font-family: 'Nunito', sans-serif;">

  <!-- Header -->
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

    <!-- Hero -->
    <div class="text-center mb-14">
      <h1 class="text-5xl font-bold mb-4 tracking-tight" style="color: #F5F2EE; font-family: 'Nunito', sans-serif; line-height: 1.1;">
        Your card, <span style="color: #F59E0B;">Just enter details and get your card! :)</span>
      </h1>
      <p class="text-base" style="color: #6B6B6B;">Describe your brand. Get a professional visiting card in seconds.</p>
    </div>

    <!-- Two column layout — Card LEFT, Controls RIGHT -->
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
              class="w-96 rounded-2xl p-8 flex flex-col justify-between"
              style="background-color: {cardData.primaryColor}; font-family: '{cardData.font}', sans-serif; min-height: 224px; transform: rotate(-1deg);"
            >
              <div>
                {#if logoUrl}
                  <img src={logoUrl} alt="Logo" class="h-8 w-8 object-contain mb-3 rounded" />
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
              <div>
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
            placeholder="e.g. Minimal black and gold card for a software consultant at a luxury tech firm"
            rows="4"
            class="w-full rounded-xl text-sm resize-none transition-all"
            style="background: #161616; border: 1px solid #2A2A2A; color: #F5F2EE; padding: 14px 16px; outline: none; font-family: 'Nunito', sans-serif;"
          ></textarea>
        </div>

        <button
          onclick={generateCard}
          disabled={loading}
          class="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
          style="background: {loading ? '#D97706' : '#F59E0B'}; color: #111111; font-family: 'Nunito', sans-serif; letter-spacing: 0.01em;"
        >
          {loading ? '✦ Generating your card...' : '✦ Generate Card'}
        </button>

        {#if error}
          <p class="text-sm px-4 py-3 rounded-lg" style="background: #1A0A0A; color: #F87171; border: 1px solid #3A1515;">{error}</p>
        {/if}

        {#if cardData}
        <div class="pt-2">
          <p class="text-xs font-medium uppercase tracking-widest mb-4" style="color: #6B6B6B;">Customize</p>

          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Background</p>
              <input type="color" bind:value={cardData.primaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Text</p>
              <input type="color" bind:value={cardData.secondaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div class="rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
              <p class="text-xs mb-2" style="color: #6B6B6B;">Font</p>
              <select bind:value={cardData.font} class="w-full text-xs rounded bg-transparent border-0 outline-none" style="color: #F5F2EE;">
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Playfair Display">Playfair</option>
                <option value="Roboto">Roboto</option>
                <option value="Oswald">Oswald</option>
                <option value="Lora">Lora</option>
              </select>
            </div>
          </div>

          <div class="mt-3 rounded-xl p-3" style="background: #161616; border: 1px solid #2A2A2A;">
            <p class="text-xs mb-2" style="color: #6B6B6B;">Logo (optional)</p>
            <div class="flex items-center gap-3">
              <label for="logo-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background: #2A2A2A; color: #F5F2EE;">
                {uploading ? 'Uploading...' : 'Choose file'}
              </label>
              <input id="logo-upload" type="file" accept="image/*" onchange={handleLogoUpload} class="hidden" />
              {#if logoUrl}
                <button onclick={() => logoUrl = ''} class="text-xs" style="color: #EF4444;">Remove</button>
              {:else}
                <span class="text-xs" style="color: #3A3A3A;">No file selected</span>
              {/if}
            </div>
          </div>

          <button
            onclick={downloadCard}
            class="mt-3 w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style="background: #161616; color: #F59E0B; border: 1px solid #3A2E1A; font-family: 'Space Grotesk', sans-serif;"
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