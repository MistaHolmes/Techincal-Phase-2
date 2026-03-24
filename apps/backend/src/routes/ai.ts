import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { getAIProvider } from '../services/ai.service';
import { analyzeReadability } from '../services/readability.service';

const router = Router();

// POST /api/ai/suggest-titles — generate title suggestions from content
router.post('/suggest-titles', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const titles = await provider.suggestTitles(content);
    return res.json({ titles });
  } catch (err) {
    console.error('Error generating titles:', err);
    return res.status(500).json({ error: 'Failed to generate title suggestions' });
  }
});

// POST /api/ai/suggest-tags — recommend tags based on content
router.post('/suggest-tags', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const tags = await provider.suggestTags(content);
    return res.json({ tags });
  } catch (err) {
    console.error('Error suggesting tags:', err);
    return res.status(500).json({ error: 'Failed to suggest tags' });
  }
});

// POST /api/ai/generate-summary — auto-generate blog summary
router.post('/generate-summary', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const provider = getAIProvider();
    const summary = await provider.generateSummary(content);
    return res.json({ summary });
  } catch (err) {
    console.error('Error generating summary:', err);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ai/readability — calculate readability score (local, no API key)
router.post('/readability', async (req, res: any) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const result = analyzeReadability(content);
    return res.json(result);
  } catch (err) {
    console.error('Error analyzing readability:', err);
    return res.status(500).json({ error: 'Failed to analyze readability' });
  }
});

// POST /api/ai/grammar-check — check grammar in text
router.post('/grammar-check', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

    const provider = getAIProvider();
    const suggestions = await provider.checkGrammar(text);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Error checking grammar:', err);
    return res.status(500).json({ error: 'Failed to check grammar' });
  }
});
 
// POST /api/ai/generate-image — generate cover image from prompt
router.post('/generate-image', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required' });

    const provider = getAIProvider();
    const imageUrl = await provider.generateImage(prompt);
    return res.json({ imageUrl });
  } catch (err) {
    console.error('Error generating image:', err);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
});

export default router;
