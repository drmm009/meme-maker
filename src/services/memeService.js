import { MEME_TEMPLATES as LOCAL_TEMPLATES, VIDEO_MEME_TEMPLATES as LOCAL_VIDEO_TEMPLATES } from '../data/templates';

// In-memory cache for open-source API templates
let cachedTemplates = null;
let cachedVideoTemplates = null;

/**
 * Fetches 100+ viral meme templates from open-source APIs (Imgflip API & Memegen API)
 * with instant fallback to local curated templates.
 */
export async function fetchOpenSourceMemes() {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  try {
    const res = await fetch('https://api.imgflip.com/get_memes');
    const data = await res.json();

    if (data.success && Array.isArray(data.data?.memes)) {
      const onlineMemes = data.data.memes.map((m, index) => {
        const lowerName = m.name.toLowerCase();
        let category = 'trending';

        if (
          lowerName.includes('cat') ||
          lowerName.includes('dog') ||
          lowerName.includes('drake') ||
          lowerName.includes('yell') ||
          lowerName.includes('guy') ||
          lowerName.includes('man') ||
          lowerName.includes('face') ||
          lowerName.includes('smile') ||
          lowerName.includes('crying') ||
          lowerName.includes('kid') ||
          lowerName.includes('pepe')
        ) {
          category = 'reaction';
        } else if (
          lowerName.includes('vs') ||
          lowerName.includes('button') ||
          lowerName.includes('trade') ||
          lowerName.includes('compare') ||
          lowerName.includes('choice') ||
          lowerName.includes('boyfriend') ||
          lowerName.includes('car') ||
          lowerName.includes('road')
        ) {
          category = 'comparison';
        } else if (
          (m.box_count && m.box_count >= 3) ||
          lowerName.includes('brain') ||
          lowerName.includes('panel') ||
          lowerName.includes('board') ||
          lowerName.includes('gru')
        ) {
          category = 'multi-panel';
        } else if (
          index < 25 ||
          lowerName.includes('classic') ||
          lowerName.includes('doge') ||
          lowerName.includes('bad luck') ||
          lowerName.includes('success')
        ) {
          category = 'classic';
        }

        // Auto-generate captions based on box_count
        const boxCount = Math.min(Math.max(m.box_count || 2, 1), 4);
        const defaultCaptions = [];

        for (let i = 0; i < boxCount; i++) {
          let yPos = 0.15;
          if (boxCount === 1) {
            yPos = 0.85;
          } else if (boxCount === 2) {
            yPos = i === 0 ? 0.15 : 0.85;
          } else {
            yPos = 0.12 + i * (0.76 / (boxCount - 1));
          }

          let defaultText = i === 0 ? 'TOP TEXT' : i === boxCount - 1 ? 'BOTTOM TEXT' : `TEXT ${i + 1}`;

          defaultCaptions.push({
            id: `cap-auto-${m.id}-${i}`,
            text: defaultText,
            x: 0.5,
            y: Number(yPos.toFixed(2)),
            fontSize: 44,
            color: '#ffffff',
            stroke: '#000000',
            align: 'center',
            fontFamily: 'Impact, sans-serif'
          });
        }

        return {
          id: `imgflip-${m.id}`,
          name: m.name,
          category: category,
          tag: 'free',
          imageUrl: m.url,
          rawImageUrl: m.url,
          width: m.width,
          height: m.height,
          boxCount: m.box_count,
          defaultCaptions,
          trendingScore: 100 - index
        };
      });

      // Merge online memes with local curated templates (avoiding duplicates)
      const localNames = new Set(LOCAL_TEMPLATES.map((t) => t.name.toLowerCase()));
      const uniqueOnline = onlineMemes.filter((m) => !localNames.has(m.name.toLowerCase()));

      cachedTemplates = [...LOCAL_TEMPLATES, ...uniqueOnline];
      return cachedTemplates;
    }
  } catch (err) {
    console.warn('Network error or API offline. Falling back to local templates dataset:', err);
  }

  cachedTemplates = LOCAL_TEMPLATES;
  return LOCAL_TEMPLATES;
}

/**
 * Fetches viral video meme templates from Giphy API & Open Source Repositories
 * with instant fallback to local curated video templates.
 */
export async function fetchOpenSourceVideoMemes() {
  if (cachedVideoTemplates) {
    return cachedVideoTemplates;
  }

  try {
    const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=cw93086RCh7MrhYWARo5JwICchujKuOf&q=meme&limit=30&rating=g');
    const data = await res.json();

    if (data.data && Array.isArray(data.data)) {
      const giphyMemes = data.data
        .filter((g) => g.images?.original_mp4?.mp4 || g.images?.looping?.mp4)
        .map((g, index) => {
          const mp4Url = g.images?.original_mp4?.mp4 || g.images?.looping?.mp4;
          const cleanTitle = (g.title || 'Meme Video')
            .replace(/\bGIF\b/gi, '')
            .replace(/\bMeme\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim() || 'Viral Meme Clip';

          return {
            id: `giphy-${g.id}`,
            name: cleanTitle,
            category: 'reaction',
            tag: 'free',
            mediaType: 'video',
            imageUrl: mp4Url,
            rawImageUrl: mp4Url,
            width: parseInt(g.images?.original?.width || '800', 10),
            height: parseInt(g.images?.original?.height || '450', 10),
            defaultCaptions: [
              { text: 'WHEN YOU SEE THIS MEME', x: 0.5, y: 0.15, fontSize: 32, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif' },
              { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 32, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif' }
            ],
            trendingScore: 100 - index
          };
        });

      cachedVideoTemplates = [...LOCAL_VIDEO_TEMPLATES, ...giphyMemes];
      return cachedVideoTemplates;
    }
  } catch (err) {
    console.warn('Giphy API offline. Falling back to local video templates dataset:', err);
  }

  cachedVideoTemplates = LOCAL_VIDEO_TEMPLATES;
  return LOCAL_VIDEO_TEMPLATES;
}
