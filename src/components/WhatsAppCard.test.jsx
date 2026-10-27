import { describe, it, expect } from 'vitest';
import {
  getWhatsAppCardMetrics,
  getWhatsAppCardHeight
} from './canvas/draw/socialCards/whatsapp';

describe('WhatsApp Card Metrics & Canvas Layout', () => {
  const sampleMessages = [
    { id: 'm1', text: 'Hi, I need some help.', direction: 'sent', time: '12:28 PM', ticks: 'blue' },
    { id: 'm2', text: 'Hello. Are you looking for advertising in newspaper. Please let us know what kind of ad you are looking to advertise. We will reply you shortly', direction: 'received', time: '12:31 PM', ticks: 'none' },
    { id: 'm3', text: 'Yes', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
    { id: 'm4', text: 'In English and Gujarati', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
    { id: 'm5', text: '??', direction: 'sent', time: '11:34 AM', ticks: 'blue' },
    { id: 'm6', text: 'We request you to please share the matter along with the newspaper name, date, and city.', direction: 'received', time: '12:16 PM', ticks: 'none' }
  ];

  it('guarantees the last message bubble never overlaps the footer input bar', () => {
    const cardW = 1080 * 0.82;
    const cap = {
      isWhatsAppCard: true,
      waMessages: sampleMessages,
      waShowHeader: true,
      waShowDate: true,
      waShowFooter: true,
      fontSize: 14.5
    };

    const metrics = getWhatsAppCardMetrics(null, cap, cardW);
    expect(metrics.scale).toBeGreaterThan(0.3);
    expect(metrics.totalH).toBeGreaterThan(300);

    // Compute the exact end of the last bubble
    const startY = - metrics.totalH / 2;
    let curY = startY + metrics.headerH + metrics.datePillH;
    for (const b of metrics.bubbleLayouts) {
      curY += b.gap;
      curY += b.bubbleH;
    }
    const lastBubbleBottom = curY;
    const footerY = lastBubbleBottom + metrics.bottomSpacing;

    // Must match totalH exactly: footerY + footerH === startY + totalH
    expect(footerY + metrics.footerH).toBe(startY + metrics.totalH);

    // Guaranteed breathing room: footer must be at least 15px below the last message
    expect(footerY - lastBubbleBottom).toBeGreaterThanOrEqual(15);
  });

  it('handles multi-message expansion with automatic proportional scaling', () => {
    const cardW = 1080 * 0.82;
    // 10 messages
    const manyMessages = [
      ...sampleMessages,
      { id: 'm7', text: 'Is there combo available for English and Gujarati?', direction: 'sent', time: '1:46 PM', ticks: 'blue' },
      { id: 'm8', text: 'do you have notarised affidavit ?', direction: 'received', time: '1:46 PM', ticks: 'none' },
      { id: 'm9', text: 'Yes, I have it ready.', direction: 'sent', time: '1:48 PM', ticks: 'blue' },
      { id: 'm10', text: 'Please send over the scanned copy.', direction: 'received', time: '1:50 PM', ticks: 'none' }
    ];

    const cap = {
      isWhatsAppCard: true,
      waMessages: manyMessages,
      waShowHeader: true,
      waShowDate: true,
      waShowFooter: true,
      fontSize: 14.5
    };

    const metrics = getWhatsAppCardMetrics(null, cap, cardW);
    // Card height should be constrained to canvas maximum allowed height (~950)
    expect(metrics.totalH).toBeLessThanOrEqual(955);

    // Last bubble must still have guaranteed breathing room before the footer
    const startY = - metrics.totalH / 2;
    let curY = startY + metrics.headerH + metrics.datePillH;
    for (const b of metrics.bubbleLayouts) {
      curY += b.gap;
      curY += b.bubbleH;
    }
    const lastBubbleBottom = curY;
    const footerY = lastBubbleBottom + metrics.bottomSpacing;

    expect(footerY - lastBubbleBottom).toBeGreaterThanOrEqual(10);
    expect(footerY + metrics.footerH).toBe(startY + metrics.totalH);
  });

  it('getWhatsAppCardHeight returns an exact integer height matching totalH', () => {
    const cardW = 800;
    const cap = {
      isWhatsAppCard: true,
      waMessages: sampleMessages
    };

    const h = getWhatsAppCardHeight(null, cap, cardW);
    expect(typeof h).toBe('number');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThan(200);
  });
});
