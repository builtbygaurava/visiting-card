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
  const validFonts = ['Montserrat', 'Poppins', 'Playfair Display', 'Roboto', 'Oswald', 'Lora'];
  if (!validFonts.includes(data.font)) {
    data.font = 'Montserrat';
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

  // Hide logo temporarily to avoid CORS issues
  const logoImg = card.querySelector('img') as HTMLImageElement | null;
  if (logoImg) logoImg.style.display = 'none';

  try {
    const dataUrl = await toPng(card, {
      pixelRatio: 2,
      canvasWidth: 600,
      canvasHeight: card.scrollHeight * 2,
      style: {
        borderRadius: '12px',
        margin: '0',
        transform: 'none'
      }
    });
    const link = document.createElement('a');
    link.download = 'visiting-card.png';
    link.href = dataUrl;
    link.click();
  } catch(err) {
    console.error('Download failed:', err);
    alert('Download failed. Try removing the logo first.');
  } finally {
    if (logoImg) logoImg.style.display = '';
  }
}
</script>

<div class="min-h-screen bg-gray-50 flex flex-col items-center p-8">
  <h1 class="text-3xl font-bold text-gray-800 mb-6">AI Visiting Card Generator</h1>

  <div class="w-full max-w-xl">
    <textarea
      bind:value={prompt}
      placeholder="e.g. Modern black and gold luxury business card for a software consultant"
      class="w-full p-4 border border-gray-300 rounded-lg resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
    ></textarea>

    <button
      onclick={generateCard}
      disabled={loading}
      class="mt-3 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
    >
      {loading ? 'Generating...' : 'Generate Card'}
    </button>

    {#if error}
      <p class="text-red-500 mt-3">{error}</p>
    {/if}
  </div>

  {#if cardData}
  <div id="card-preview" class="mt-10 w-96 rounded-xl shadow-lg p-8 flex flex-col justify-between gap-8 overflow-hidden" style="background-color: {cardData.primaryColor}; font-family: {cardData.font}">
    <div>
    {#if logoUrl}
  <img src={logoUrl} alt="Logo" class="h-8 w-8 object-contain mb-2 rounded" />
{/if}
      <h2
        contenteditable="true"
        bind:innerText={cardData.name}
        class="text-2xl font-bold outline-none focus:bg-white/10 rounded px-1"
        style="color: {cardData.secondaryColor}"
      ></h2>
      <p
        contenteditable="true"
        bind:innerText={cardData.title}
        class="outline-none focus:bg-white/10 rounded px-1"
        style="color: {cardData.secondaryColor}"
      ></p>
    </div>
    <div>
      <p
        contenteditable="true"
        bind:innerText={cardData.company}
        class="font-semibold outline-none focus:bg-white/10 rounded px-1"
        style="color: {cardData.secondaryColor}"
      ></p>
      <p
        contenteditable="true"
        bind:innerText={cardData.tagline}
        class="text-sm italic outline-none focus:bg-white/10 rounded px-1"
        style="color: {cardData.secondaryColor}"
      ></p>
    </div>
  </div>

  <div class="mt-4 flex gap-4 items-center flex-wrap">
  <label class="flex items-center gap-2 text-sm text-gray-700">
    Background
    <input type="color" bind:value={cardData.primaryColor} class="w-8 h-8 rounded cursor-pointer" />
  </label>
  <label class="flex items-center gap-2 text-sm text-gray-700">
    Text Color
    <input type="color" bind:value={cardData.secondaryColor} class="w-8 h-8 rounded cursor-pointer" />
  </label>
  <label class="flex items-center gap-2 text-sm text-gray-700">
    Font
    <select bind:value={cardData.font} class="border border-gray-300 rounded px-2 py-1">
      <option value="Montserrat">Montserrat</option>
      <option value="Poppins">Poppins</option>
      <option value="Playfair Display">Playfair Display</option>
      <option value="Roboto">Roboto</option>
      <option value="Oswald">Oswald</option>
      <option value="Lora">Lora</option>
    </select>
  </label>
</div>
<div class="mt-3">
  <label for="logo-upload" class="text-sm text-gray-700 font-medium block mb-1">Upload Logo</label>
  <input
    type="file"
    accept="image/*"
    onchange={handleLogoUpload}
    class="text-sm text-gray-500"
  />
  {#if uploading}
    <p class="text-sm text-blue-500 mt-1">Uploading...</p>
  {/if}
  {#if logoUrl}
  <button
    onclick={() => logoUrl = ''}
    class="mt-1 text-xs text-red-500 hover:underline"
  >
    Remove logo
  </button>
{/if}
</div>


  <button
    onclick={downloadCard}
    class="mt-4 w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
  >
    Download Card
  </button>

{/if}
</div>
