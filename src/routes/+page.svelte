<script lang="ts">
  import { toPng } from 'html-to-image';

  let prompt        = $state('');
  let loading       = $state(false);
  let cardData      = $state<any>(null);
  let error         = $state('');
  let logoBase64    = $state('');
  let showBg        = $state(true);
  let activeSide    = $state<'front' | 'back'>('front');
  let bgType        = $state('solid');
  let bgColor2      = $state('#ffffff');
  let patternType   = $state('dots');
  let bgImage       = $state('');
  let backBgType    = $state('pattern');
  let backBgColor2  = $state('#000000');
  let backPattern   = $state('moroccan');
  let backBgImage   = $state('');
  let backColor     = $state('#1a1a1a');
  let backTextColor = $state('#F59E0B');
  let backTagline   = $state('');
  let backWebsite   = $state('');
  let backEmail     = $state('');
  let backSocial    = $state('');

  const CARD_W = 384;
  const CARD_H = 224;
  const SNAP   = 8;

  const DEFAULT_POS = () => ({
    logo:    { x: 24, y: 24 },
    name:    { x: 24, y: 80 },
    title:   { x: 24, y: 110 },
    company: { x: 24, y: 160 },
    tagline: { x: 24, y: 182 },
    phone:   { x: 24, y: 200 },
  });

  let livePos = DEFAULT_POS();
  let pos = $state(DEFAULT_POS());
  let gRefs: Record<string, HTMLElement | null> = {};

  function setGuide(k: string, show: boolean, style?: Partial<CSSStyleDeclaration>) {
    const el = gRefs[k];
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (style && show) Object.assign(el.style, style);
  }
  function hideAllGuides() {
    Object.keys(gRefs).forEach(k => { if (gRefs[k]) gRefs[k]!.style.display = 'none'; });
  }

  function resetPos() {
    livePos = DEFAULT_POS();
    pos = DEFAULT_POS();
  }

  function makeDraggable(id: string, el: HTMLElement) {
    let startClientX = 0, startClientY = 0;
    let startPosX    = 0, startPosY    = 0;

    function onPointerMove(e: PointerEvent) {
      const lp = livePos[id as keyof typeof livePos];
      const w  = el.offsetWidth  || 80;
      const h  = el.offsetHeight || 20;

      let nx = startPosX + (e.clientX - startClientX);
      let ny = startPosY + (e.clientY - startClientY);
      nx = Math.max(0, Math.min(nx, CARD_W - w));
      ny = Math.max(0, Math.min(ny, CARD_H - h));

      const cx = nx + w/2, cy = ny + h/2;
      const ids = ['logo','name','title','company','tagline','phone'];

      let gCx=false,gCy=false,gL=false,gR=false,gT=false,gB=false;
      if (Math.abs(cx-CARD_W/2)<SNAP) { gCx=true; nx=CARD_W/2-w/2; }
      if (Math.abs(cy-CARD_H/2)<SNAP) { gCy=true; ny=CARD_H/2-h/2; }
      if (Math.abs(nx)<SNAP)           { gL=true;  nx=0; }
      if (Math.abs(nx+w-CARD_W)<SNAP)  { gR=true;  nx=CARD_W-w; }
      if (Math.abs(ny)<SNAP)           { gT=true;  ny=0; }
      if (Math.abs(ny+h-CARD_H)<SNAP)  { gB=true;  ny=CARD_H-h; }

      const elLines: {v:boolean;p:number}[] = [];
      ids.forEach(oid => {
        if (oid===id) return;
        const oel = document.getElementById(`drag-${oid}`);
        if (!oel) return;
        const op  = livePos[oid as keyof typeof livePos];
        const ow  = oel.offsetWidth||80, oh=oel.offsetHeight||20;
        const ocx = op.x+ow/2, ocy=op.y+oh/2;
        const checks: [number,()=>void][] = [
          [nx-op.x,       ()=>{nx=op.x;      elLines.push({v:true,p:op.x});}],
          [nx+w-op.x-ow,  ()=>{nx=op.x+ow-w; elLines.push({v:true,p:op.x+ow});}],
          [cx-ocx,        ()=>{nx=ocx-w/2;   elLines.push({v:true,p:ocx});}],
          [ny-op.y,       ()=>{ny=op.y;       elLines.push({v:false,p:op.y});}],
          [ny+h-op.y-oh,  ()=>{ny=op.y+oh-h; elLines.push({v:false,p:op.y+oh});}],
          [cy-ocy,        ()=>{ny=ocy-h/2;    elLines.push({v:false,p:ocy});}],
        ];
        checks.forEach(([d,fn])=>{ if(Math.abs(d)<SNAP) fn(); });
      });

      lp.x = nx; lp.y = ny;
      el.style.transform = `translate(${nx}px,${ny}px)`;
      setGuide('cx',    gCx, {left:'50%'});
      setGuide('cy',    gCy, {top:'50%'});
      setGuide('left',  gL,  {left:'0'});
      setGuide('right', gR,  {right:'0'});
      setGuide('top',   gT,  {top:'0'});
      setGuide('bottom',gB,  {bottom:'0'});
      for (let i=0;i<4;i++) {
        const ln=elLines[i];
        if (ln) {
          setGuide(`el${i}`, true, ln.v
            ? {left:`${ln.p}px`,top:'0',width:'1px',height:'100%',bottom:'auto',right:'auto'}
            : {top:`${ln.p}px`,left:'0',height:'1px',width:'100%',bottom:'auto',right:'auto'});
        } else { setGuide(`el${i}`, false); }
      }
    }

    function onPointerUp(e: PointerEvent) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
      el.releasePointerCapture(e.pointerId);
      hideAllGuides();
      pos[id as keyof typeof pos].x = livePos[id as keyof typeof livePos].x;
      pos[id as keyof typeof pos].y = livePos[id as keyof typeof livePos].y;
    }

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      if ((e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      startClientX = e.clientX;
      startClientY = e.clientY;
      startPosX    = livePos[id as keyof typeof livePos].x;
      startPosY    = livePos[id as keyof typeof livePos].y;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup',   onPointerUp);
    });
  }

  function initDraggable() {
    const ids = ['logo','name','title','company','tagline','phone'];
    ids.forEach(id => {
      const el = document.getElementById(`drag-${id}`);
      if (el) makeDraggable(id, el);
    });
  }

  const ALL_PATTERNS = ['dots','lines','grid','hexagons','waves','triangles','stripes','circles','zigzag','circuit','mesh','cross','diamond','moroccan','grain','leaf','stars','starburst','fishscale','concentric','pinwheel'];

  function svgPat(type: string, c: string): string {
    const m: Record<string,string> = {
      dots:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="6" cy="6" r="2" fill="${c}"/></svg>`,
      lines:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="0" y1="0" x2="20" y2="20" stroke="${c}" stroke-width="1"/></svg>`,
      grid:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="${c}" stroke-width="0.5"/></svg>`,
      hexagons:`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32"><polygon points="14,1 27,8 27,24 14,31 1,24 1,8" fill="none" stroke="${c}" stroke-width="1"/></svg>`,
      waves:`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="12"><path d="M0 6 Q10 0 20 6 Q30 12 40 6" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`,
      triangles:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><polygon points="10,2 18,18 2,18" fill="${c}"/></svg>`,
      stripes:`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><line x1="0" y1="10" x2="10" y2="0" stroke="${c}" stroke-width="2"/></svg>`,
      circles:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="2"/></svg>`,
      zigzag:`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="12"><polyline points="0,12 10,0 20,12 30,0 40,12" fill="none" stroke="${c}" stroke-width="1.5"/></svg>`,
      circuit:`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect x="18" y="18" width="4" height="4" fill="${c}"/><line x1="0" y1="20" x2="18" y2="20" stroke="${c}" stroke-width="1"/><line x1="22" y1="20" x2="40" y2="20" stroke="${c}" stroke-width="1"/><line x1="20" y1="0" x2="20" y2="18" stroke="${c}" stroke-width="1"/><line x1="20" y1="22" x2="20" y2="40" stroke="${c}" stroke-width="1"/><circle cx="0" cy="20" r="2" fill="${c}"/><circle cx="40" cy="20" r="2" fill="${c}"/><circle cx="20" cy="0" r="2" fill="${c}"/><circle cx="20" cy="40" r="2" fill="${c}"/></svg>`,
      mesh:`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><line x1="0" y1="0" x2="20" y2="40" stroke="${c}" stroke-width="0.8"/><line x1="20" y1="0" x2="40" y2="40" stroke="${c}" stroke-width="0.8"/><line x1="40" y1="0" x2="20" y2="40" stroke="${c}" stroke-width="0.8"/><line x1="0" y1="0" x2="40" y2="20" stroke="${c}" stroke-width="0.8"/></svg>`,
      cross:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect x="8" y="2" width="4" height="16" fill="${c}"/><rect x="2" y="8" width="16" height="4" fill="${c}"/></svg>`,
      diamond:`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="${c}" stroke-width="1.5"/><polygon points="12,6 18,12 12,18 6,12" fill="${c}" opacity="0.5"/></svg>`,
      moroccan:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><polygon points="16,2 20,10 30,10 22,16 26,26 16,20 6,26 10,16 2,10 12,10" fill="${c}"/></svg>`,
      grain:`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="5" cy="8" r="1.2" fill="${c}"/><circle cx="15" cy="3" r="0.8" fill="${c}"/><circle cx="28" cy="12" r="1.4" fill="${c}"/><circle cx="38" cy="5" r="1" fill="${c}"/><circle cx="10" cy="20" r="1.1" fill="${c}"/><circle cx="22" cy="25" r="1.5" fill="${c}"/><circle cx="35" cy="22" r="0.8" fill="${c}"/><circle cx="3" cy="32" r="1.2" fill="${c}"/><circle cx="18" cy="38" r="1" fill="${c}"/><circle cx="30" cy="35" r="1.4" fill="${c}"/></svg>`,
      leaf:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M4,28 Q16,4 28,4 Q28,16 4,28Z" fill="${c}" opacity="0.8"/><line x1="4" y1="28" x2="22" y2="10" stroke="${c}" stroke-width="0.8"/></svg>`,
      stars:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><polygon points="16,4 17.5,13 26,13 19,18 22,27 16,22 10,27 13,18 6,13 14.5,13" fill="${c}"/></svg>`,
      starburst:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><polygon points="16,2 17,14 28,8 19,16 28,24 17,18 16,30 15,18 4,24 13,16 4,8 15,14" fill="${c}"/></svg>`,
      fishscale:`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><path d="M0,30 Q15,15 30,30" fill="none" stroke="${c}" stroke-width="2"/><path d="M-15,15 Q0,0 15,15" fill="none" stroke="${c}" stroke-width="2"/><path d="M15,15 Q30,0 45,15" fill="none" stroke="${c}" stroke-width="2"/></svg>`,
      concentric:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><polygon points="16,2 22,10 30,10 24,18 26,28 16,24 6,28 8,18 2,10 10,10" fill="none" stroke="${c}" stroke-width="1"/><polygon points="16,8 20,13 25,13 21,17 23,23 16,20 9,23 11,17 7,13 12,13" fill="${c}" opacity="0.5"/></svg>`,
      pinwheel:`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M16,16 Q24,8 28,16 Q24,24 16,16Z" fill="${c}"/><path d="M16,16 Q8,24 16,28 Q24,24 16,16Z" fill="${c}" opacity="0.7"/><path d="M16,16 Q8,8 4,16 Q8,24 16,16Z" fill="${c}" opacity="0.5"/><path d="M16,16 Q24,8 16,4 Q8,8 16,16Z" fill="${c}" opacity="0.3"/></svg>`,
    };
    return `url("data:image/svg+xml,${encodeURIComponent(m[type]??m.dots)}")`;
  }

  function bgStyle(type:string,primary:string,c2:string,pat:string,img:string,show:boolean,text='#fff'):string {
    if (!show) return 'background:transparent;';
    switch(type) {
      case 'gradient': return `background:linear-gradient(135deg,${primary},${c2});`;
      case 'pattern':  return `background-color:${primary};background-image:${svgPat(pat,text+'aa')};`;
      case 'image':    return img?`background:url(${img}) center/cover no-repeat;`:`background:${primary};`;
      default:         return `background:${primary};`;
    }
  }

  const frontStyle  = () => bgStyle(bgType,cardData?.primaryColor??'#000',bgColor2,patternType,bgImage,showBg,cardData?.secondaryColor??'#fff');
  const backBgStyle = () => bgStyle(backBgType,backColor,backBgColor2,backPattern,backBgImage,true,backTextColor);

  function readFile(e:Event,cb:(r:string)=>void) {
    const f=(e.target as HTMLInputElement).files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=ev=>cb(ev.target?.result as string); r.readAsDataURL(f);
  }

  async function generateCard() {
    if (!prompt.trim()) return;
    loading=true; error=''; cardData=null;
    try {
      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
      const data=await res.json();
      if (data.error) { error=data.error; }
      else {
        const vf=['Montserrat','Poppins','Playfair Display','Roboto','Oswald','Lora','Nunito','Inter'];
        if (!vf.includes(data.font)) data.font='Nunito';
        const m=prompt.match(/(\+?\d[\d\s\-().]{7,})/);
        if (!data.phone||data.phone==='+1 (555) 000-0000') data.phone=m?.[0]?.trim()??'';
        cardData=data; backColor=data.primaryColor; backTextColor=data.secondaryColor; backTagline=data.tagline??'';
        resetPos();
        setTimeout(initDraggable, 200);
      }
    } catch { error='Something went wrong. Try again.'; }
    finally { loading=false; }
  }

  async function capture(id:string, name:string) {
    const el = document.getElementById(id);
    if (!el) return;
    // Temporarily make visible if hidden
    const prev = el.closest('[data-card-side]') as HTMLElement | null;
    const wasHidden = prev && prev.style.display === 'none';
    if (wasHidden && prev) prev.style.display = 'block';
    await new Promise(r => setTimeout(r, 50)); // allow paint
    const url = await toPng(el, {pixelRatio:3, style:{borderRadius:'16px',transform:'none',margin:'0'}});
    if (wasHidden && prev) prev.style.display = 'none';
    Object.assign(document.createElement('a'),{download:name,href:url}).click();
  }

  const downloadCard = () => capture(
    activeSide==='front' ? 'card-preview-front' : 'card-preview-back',
    `card-${activeSide}.png`
  );

  async function downloadBoth() {
    await capture('card-preview-front', 'card-front.png');
    await new Promise(r => setTimeout(r, 500));
    await capture('card-preview-back', 'card-back.png');
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Playfair+Display:wght@400;700&family=Roboto:wght@400;700&family=Oswald:wght@400;700&family=Lora:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="min-h-screen" style="background:#111;font-family:'Nunito',sans-serif;">
  <header style="border-bottom:1px solid #1E1E1E;">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#F59E0B;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h4M7 12h8M7 16h5"/>
          </svg>
        </div>
        <span class="font-semibold text-sm" style="color:#F5F2EE;">CardDeployer</span>
      </div>
      <span class="text-xs px-2 py-1 rounded-full" style="background:#1A1200;color:#F59E0B;border:1px solid #3D2E00;">AI-powered</span>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-12">
    <div class="text-center mb-14">
      <h1 class="text-5xl font-bold mb-4" style="color:#F5F2EE;line-height:1.1;">
        Your card, <span style="color:#F59E0B;">designed by AI ✦</span>
      </h1>
      <p class="text-base" style="color:#6B6B6B;">Describe your brand. Get a professional visiting card in seconds.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

      <!-- LEFT: Preview -->
      <div class="flex flex-col items-center pt-2">
        {#if !cardData && !loading}
          <div class="w-full aspect-[1.75] rounded-2xl flex flex-col items-center justify-center" style="background:#161616;border:1px dashed #2A2A2A;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2" class="mb-3"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 8h4M7 12h8M7 16h5"/></svg>
            <p class="text-sm" style="color:#3A3A3A;">Your card preview will appear here</p>
          </div>
        {/if}

        {#if loading}
          <div class="w-full aspect-[1.75] rounded-2xl flex items-center justify-center" style="background:#161616;border:1px solid #2A2A2A;">
            <div class="text-center">
              <div class="spin w-6 h-6 rounded-full border-2 mx-auto mb-3" style="border-color:#F59E0B;border-top-color:transparent;"></div>
              <p class="text-sm" style="color:#6B6B6B;">Crafting your card…</p>
            </div>
          </div>
        {/if}

        {#if cardData}
          <!-- Tabs -->
          <div class="flex gap-2 mb-5 rounded-xl p-1" style="background:#161616;border:1px solid #2A2A2A;">
            {#each (['front','back'] as const) as side}
              <button onclick={()=>activeSide=side} class="px-6 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize"
                      style="background:{activeSide===side?'#F59E0B':'transparent'};color:{activeSide===side?'#111':'#6B6B6B'};">{side}</button>
            {/each}
          </div>

          <!-- FRONT — always in DOM, hidden via display:none when inactive -->
          <div data-card-side="front" style="display:{activeSide==='front'?'block':'none'}">
            <div class="relative" style="width:{CARD_W}px;filter:drop-shadow(0 20px 40px rgba(245,158,11,.15));">
              <div class="gd-overlay">
                <div bind:this={gRefs['cx']}     class="gd-v" style="display:none;left:50%;background:#F59E0B;box-shadow:0 0 5px #F59E0B;"></div>
                <div bind:this={gRefs['cy']}     class="gd-h" style="display:none;top:50%;background:#F59E0B;box-shadow:0 0 5px #F59E0B;"></div>
                <div bind:this={gRefs['left']}   class="gd-v" style="display:none;left:0;background:#06B6D4;box-shadow:0 0 5px #06B6D4;"></div>
                <div bind:this={gRefs['right']}  class="gd-v" style="display:none;right:0;background:#06B6D4;box-shadow:0 0 5px #06B6D4;"></div>
                <div bind:this={gRefs['top']}    class="gd-h" style="display:none;top:0;background:#06B6D4;box-shadow:0 0 5px #06B6D4;"></div>
                <div bind:this={gRefs['bottom']} class="gd-h" style="display:none;bottom:0;background:#06B6D4;box-shadow:0 0 5px #06B6D4;"></div>
                <div bind:this={gRefs['el0']} style="display:none;position:absolute;background:#EC4899;box-shadow:0 0 5px #EC4899;"></div>
                <div bind:this={gRefs['el1']} style="display:none;position:absolute;background:#EC4899;box-shadow:0 0 5px #EC4899;"></div>
                <div bind:this={gRefs['el2']} style="display:none;position:absolute;background:#EC4899;box-shadow:0 0 5px #EC4899;"></div>
                <div bind:this={gRefs['el3']} style="display:none;position:absolute;background:#EC4899;box-shadow:0 0 5px #EC4899;"></div>
              </div>
              <div id="card-preview-front" class="rounded-2xl overflow-hidden"
                   style="{frontStyle()} font-family:'{cardData.font}',sans-serif; width:{CARD_W}px; height:{CARD_H}px; position:relative; border:{showBg?'none':'1px dashed #3A3A3A'};">
                {#if logoBase64}
                  <div id="drag-logo" class="drag-el" style="transform:translate({pos.logo.x}px,{pos.logo.y}px);">
                    <img src={logoBase64} alt="Logo" class="h-10 w-10 object-contain rounded" draggable="false"/>
                  </div>
                {/if}
                <div id="drag-name" class="drag-el" style="transform:translate({pos.name.x}px,{pos.name.y}px);">
                  <h2 contenteditable="true" bind:innerText={cardData.name} class="text-2xl font-bold outline-none" style="color:{cardData.secondaryColor};white-space:nowrap;min-width:4px;"></h2>
                </div>
                <div id="drag-title" class="drag-el" style="transform:translate({pos.title.x}px,{pos.title.y}px);">
                  <p contenteditable="true" bind:innerText={cardData.title} class="text-sm outline-none opacity-80" style="color:{cardData.secondaryColor};white-space:nowrap;min-width:4px;"></p>
                </div>
                <div id="drag-company" class="drag-el" style="transform:translate({pos.company.x}px,{pos.company.y}px);">
                  <p contenteditable="true" bind:innerText={cardData.company} class="font-semibold outline-none" style="color:{cardData.secondaryColor};white-space:nowrap;min-width:4px;"></p>
                </div>
                <div id="drag-tagline" class="drag-el" style="transform:translate({pos.tagline.x}px,{pos.tagline.y}px);">
                  <p contenteditable="true" bind:innerText={cardData.tagline} class="text-xs italic outline-none opacity-70" style="color:{cardData.secondaryColor};white-space:nowrap;min-width:4px;"></p>
                </div>
                {#if cardData.phone}
                  <div id="drag-phone" class="drag-el" style="transform:translate({pos.phone.x}px,{pos.phone.y}px);">
                    <p contenteditable="true" bind:innerText={cardData.phone} class="text-xs outline-none opacity-80" style="color:{cardData.secondaryColor};white-space:nowrap;min-width:4px;"></p>
                  </div>
                {/if}
              </div>
            </div>
            <p class="text-xs mt-3" style="color:#3A3A3A;">✦ Drag freely · Click text to edit · 🟡 center · 🔵 edge · 🩷 align</p>
          </div>

          <!-- BACK — always in DOM, hidden via display:none when inactive -->
          <div data-card-side="back" style="display:{activeSide==='back'?'block':'none'}">
            <div style="filter:drop-shadow(0 20px 40px rgba(245,158,11,.15));">
              <div id="card-preview-back" class="rounded-2xl overflow-hidden flex items-center justify-center"
                   style="{backBgStyle()} font-family:'{cardData.font}',sans-serif; width:{CARD_W}px; height:{CARD_H}px;">
                <div class="flex flex-col items-center text-center px-8">
                  {#if logoBase64}<img src={logoBase64} alt="Logo" class="h-12 w-12 object-contain rounded mb-3"/>{/if}
                  <p contenteditable="true" bind:innerText={backTagline} class="text-sm font-semibold outline-none mb-3" style="color:{backTextColor};min-width:4px;"></p>
                  {#if backWebsite}<p class="text-xs opacity-80 mb-1" style="color:{backTextColor};">🌐 {backWebsite}</p>{/if}
                  {#if backEmail}  <p class="text-xs opacity-80 mb-1" style="color:{backTextColor};">✉️ {backEmail}</p>{/if}
                  {#if backSocial}<p class="text-xs opacity-80"       style="color:{backTextColor};">@ {backSocial}</p>{/if}
                </div>
              </div>
            </div>
            <p class="text-xs mt-3" style="color:#3A3A3A;">✦ Designing back of card</p>
          </div>
        {/if}
      </div>

      <!-- RIGHT: Controls -->
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium mb-2 uppercase tracking-widest" style="color:#6B6B6B;">Describe your card</label>
          <textarea bind:value={prompt} rows="4" placeholder="Try: Modern minimal card for Alex Kumar, CEO at Nexus Labs, +91 98765 43210"
                    class="w-full rounded-xl text-sm resize-none"
                    style="background:#161616;border:1px solid #2A2A2A;color:#F5F2EE;padding:14px 16px;outline:none;font-family:'Nunito',sans-serif;"></textarea>
        </div>

        <button onclick={generateCard} disabled={loading} class="w-full py-3.5 rounded-xl font-semibold text-sm"
                style="background:{loading?'#D97706':'#F59E0B'};color:#111;">
          {loading?'✦ Generating…':'✦ Generate Card'}
        </button>

        {#if error}<p class="text-sm px-4 py-3 rounded-lg" style="background:#1A0A0A;color:#F87171;border:1px solid #3A1515;">{error}</p>{/if}

        {#if cardData}
          <div class="space-y-3">
            <p class="text-xs font-medium uppercase tracking-widest pt-1" style="color:#6B6B6B;">Customize — {activeSide==='front'?'Front':'Back'}</p>

            {#if activeSide==='front'}
              <div class="grid grid-cols-3 gap-3">
                <div class="cb"><p class="cl">Card Color</p><input type="color" bind:value={cardData.primaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent"/></div>
                <div class="cb"><p class="cl">Text Color</p><input type="color" bind:value={cardData.secondaryColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent"/></div>
                <div class="cb"><p class="cl">Font</p>
                  <select bind:value={cardData.font} class="w-full text-xs rounded bg-transparent border-0 outline-none" style="color:#F5F2EE;">
                    {#each ['Nunito','Montserrat','Poppins','Playfair Display','Roboto','Oswald','Lora'] as f}<option value={f}>{f}</option>{/each}
                  </select>
                </div>
              </div>

              <div class="cb">
                <p class="cl mb-2">Card Background</p>
                <div class="grid grid-cols-4 gap-2 mb-3">
                  {#each ['solid','gradient','pattern','image'] as t}
                    <button onclick={()=>bgType=t} class="text-xs py-1.5 rounded-lg capitalize font-medium"
                            style="background:{bgType===t?'#F59E0B':'#2A2A2A'};color:{bgType===t?'#111':'#F5F2EE'};">{t}</button>
                  {/each}
                </div>
                {#if bgType==='solid'}
                  <div class="flex items-center gap-2">
                    <span class="text-xs" style="color:#6B6B6B;">Color:</span>
                    <input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/>
                    <button onclick={()=>showBg=!showBg} class="text-xs px-2 py-1 rounded-lg ml-auto"
                            style="background:{showBg?'#F59E0B22':'#2A2A2A'};color:{showBg?'#F59E0B':'#6B6B6B'};border:1px solid {showBg?'#F59E0B44':'#3A3A3A'};">
                      {showBg?'✓ Visible':'✗ Hidden'}
                    </button>
                  </div>
                {/if}
                {#if bgType==='gradient'}
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-xs" style="color:#6B6B6B;">Color 1:</span><input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/>
                    <span class="text-xs" style="color:#6B6B6B;">Color 2:</span><input type="color" bind:value={bgColor2} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/>
                  </div>
                {/if}
                {#if bgType==='pattern'}
                  <div class="space-y-2">
                    <div class="grid grid-cols-3 gap-1.5">
                      {#each ALL_PATTERNS as p}
                        <button onclick={()=>patternType=p} class="py-1 rounded-lg capitalize text-center"
                                style="background:{patternType===p?'#F59E0B':'#2A2A2A'};color:{patternType===p?'#111':'#F5F2EE'};font-size:10px;">{p}</button>
                      {/each}
                    </div>
                    <div class="flex items-center gap-2 pt-1"><span class="text-xs" style="color:#6B6B6B;">Base:</span><input type="color" bind:value={cardData.primaryColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/></div>
                  </div>
                {/if}
                {#if bgType==='image'}
                  <div class="flex items-center gap-3">
                    <label for="bg-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background:#2A2A2A;color:#F5F2EE;">{bgImage?'Change':'Upload image'}</label>
                    <input id="bg-upload" type="file" accept="image/*" onchange={(e)=>readFile(e,v=>{bgImage=v;bgType='image';})} class="hidden"/>
                    {#if bgImage}<button onclick={()=>{bgImage='';bgType='solid';}} class="text-xs" style="color:#EF4444;">Remove</button>{/if}
                  </div>
                {/if}
              </div>

              <div class="cb">
                <p class="cl mb-2">Business Logo</p>
                <div class="flex items-center gap-3">
                  {#if logoBase64}<img src={logoBase64} alt="preview" class="h-8 w-8 object-contain rounded" style="border:1px solid #3A3A3A;"/>{/if}
                  <label for="logo-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background:#2A2A2A;color:#F5F2EE;">{logoBase64?'Change logo':'Upload logo'}</label>
                  <input id="logo-upload" type="file" accept="image/*" onchange={(e)=>readFile(e,v=>logoBase64=v)} class="hidden"/>
                  {#if logoBase64}<button onclick={()=>logoBase64=''} class="text-xs" style="color:#EF4444;">Remove</button>
                  {:else}<span class="text-xs" style="color:#3A3A3A;">No logo</span>{/if}
                </div>
              </div>
            {/if}

            {#if activeSide==='back'}
              <div class="grid grid-cols-2 gap-3">
                <div class="cb"><p class="cl">Back Color</p><input type="color" bind:value={backColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent"/></div>
                <div class="cb"><p class="cl">Text Color</p><input type="color" bind:value={backTextColor} class="w-full h-8 rounded cursor-pointer border-0 bg-transparent"/></div>
              </div>
              <div class="cb">
                <p class="cl mb-2">Back Background</p>
                <div class="grid grid-cols-4 gap-2 mb-3">
                  {#each ['solid','gradient','pattern','image'] as t}
                    <button onclick={()=>backBgType=t} class="text-xs py-1.5 rounded-lg capitalize font-medium"
                            style="background:{backBgType===t?'#F59E0B':'#2A2A2A'};color:{backBgType===t?'#111':'#F5F2EE'};">{t}</button>
                  {/each}
                </div>
                {#if backBgType==='solid'}<div class="flex items-center gap-2"><span class="text-xs" style="color:#6B6B6B;">Color:</span><input type="color" bind:value={backColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/></div>{/if}
                {#if backBgType==='gradient'}
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-xs" style="color:#6B6B6B;">Color 1:</span><input type="color" bind:value={backColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/>
                    <span class="text-xs" style="color:#6B6B6B;">Color 2:</span><input type="color" bind:value={backBgColor2} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/>
                  </div>
                {/if}
                {#if backBgType==='pattern'}
                  <div class="space-y-2">
                    <div class="grid grid-cols-3 gap-1.5">
                      {#each ALL_PATTERNS as p}
                        <button onclick={()=>backPattern=p} class="py-1 rounded-lg capitalize text-center"
                                style="background:{backPattern===p?'#F59E0B':'#2A2A2A'};color:{backPattern===p?'#111':'#F5F2EE'};font-size:10px;">{p}</button>
                      {/each}
                    </div>
                    <div class="flex items-center gap-2 pt-1"><span class="text-xs" style="color:#6B6B6B;">Base:</span><input type="color" bind:value={backColor} class="h-7 w-12 rounded cursor-pointer border-0 bg-transparent"/></div>
                  </div>
                {/if}
                {#if backBgType==='image'}
                  <div class="flex items-center gap-3">
                    <label for="back-bg-upload" class="cursor-pointer text-xs px-3 py-1.5 rounded-lg" style="background:#2A2A2A;color:#F5F2EE;">{backBgImage?'Change':'Upload image'}</label>
                    <input id="back-bg-upload" type="file" accept="image/*" onchange={(e)=>readFile(e,v=>{backBgImage=v;backBgType='image';})} class="hidden"/>
                    {#if backBgImage}<button onclick={()=>{backBgImage='';backBgType='solid';}} class="text-xs" style="color:#EF4444;">Remove</button>{/if}
                  </div>
                {/if}
              </div>
              <div class="cb space-y-2">
                <p class="cl mb-1">Back Card Content</p>
                <input bind:value={backWebsite} placeholder="🌐 Website"      class="inp"/>
                <input bind:value={backEmail}   placeholder="✉️ Email"         class="inp"/>
                <input bind:value={backSocial}  placeholder="@ Social handle" class="inp"/>
              </div>
            {/if}

            <div class="grid grid-cols-2 gap-3 pt-1">
              <button onclick={downloadCard} class="py-3 rounded-xl font-semibold text-sm" style="background:#161616;color:#F59E0B;border:1px solid #3A2E1A;">↓ This side</button>
              <button onclick={downloadBoth} class="py-3 rounded-xl font-semibold text-sm" style="background:#F59E0B;color:#111;">↓ Both sides</button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  @keyframes spin { to { transform:rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
  textarea::placeholder { color:#3A3A3A; }
  textarea:focus { border-color:#F59E0B !important; }
  select option { background:#161616; color:#F5F2EE; }
  :global(.cb)  { background:#161616; border:1px solid #2A2A2A; border-radius:12px; padding:12px; }
  :global(.cl)  { font-size:12px; color:#6B6B6B; display:block; }
  :global(.inp) { width:100%; font-size:12px; border-radius:8px; padding:8px 12px; outline:none; background:#2A2A2A; color:#F5F2EE; border:1px solid #3A3A3A; }
  .gd-overlay { position:absolute; inset:0; pointer-events:none; z-index:30; }
  .gd-v { position:absolute; top:0; bottom:0; width:1px; }
  .gd-h { position:absolute; left:0; right:0; height:1px; }
  .drag-el {
    position:absolute; top:0; left:0;
    cursor:grab; user-select:none;
    will-change:transform;
    padding:4px 6px; border-radius:3px;
  }
  .drag-el:active { cursor:grabbing; }
  .drag-el:hover  { outline:1px dashed rgba(245,158,11,.5); outline-offset:2px; }
  .drag-el * { pointer-events:none; }
  .drag-el *:focus { pointer-events:all; }
</style>