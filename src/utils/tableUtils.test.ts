import { describe, it, expect } from 'vitest';
import {
  cleanAndRepairMarkdownTable,
  repairAllTablesInDocument,
  tsvToMarkdownTable,
  sanitizeAiCitations,
  parseTableAlignments,
  isTableSeparatorRow,
  processPastedNotesContent
} from './tableUtils';

describe('tableUtils', () => {
  it('sanitizes AI citations and PDF chips', () => {
    const raw = '0.025% (Sirf Sell side) PDF';
    expect(sanitizeAiCitations(raw)).toBe('0.025% (Sirf Sell side)');

    const withBrackets = 'Stockbroker [PDF] [1]';
    expect(sanitizeAiCitations(withBrackets)).toBe('Stockbroker');
  });

  it('converts TSV copied from web/Excel to Markdown Table', () => {
    const tsv = "Item\tPrice\tQuantity\nApple\t10\t5\nBanana\t5\t12";
    const md = tsvToMarkdownTable(tsv);
    expect(md).toContain('| Item | Price | Quantity |');
    expect(md).toContain('| :--- | :--- | :--- |');
    expect(md).toContain('| Apple | 10 | 5 |');
    expect(md).toContain('| Banana | 5 | 12 |');
  });

  it('detects and parses table alignments', () => {
    const sep = '| :--- | :---: | ---: |';
    expect(parseTableAlignments(sep)).toEqual(['left', 'center', 'right']);
  });

  it('repairs broken table rows and merges fragmented cells', () => {
    const broken = `| Charge Component | Intraday Equity | Delivery Equity | Collecting Authority |
|---|---|---|---|
| **Brokerage** | Flat ₹20 ya 0.03% (jo kam ho) | Flat ₹20 ya Zero (broker policy par depend karta hai) | Stockbroker
|
| 0.1% (Buy aur Sell dono side)
| Central Government
|
| Flat ₹13.50 se ₹18 per day per company | Depository (CDSL/NSDL) + Broker`;

    const repaired = cleanAndRepairMarkdownTable(broken);
    expect(repaired).toContain('| Charge Component | Intraday Equity | Delivery Equity | Collecting Authority |');
    expect(repaired).toContain('| :--- | :--- | :--- | :--- |');
    // Ensure orphan "|" lines are eliminated
    expect(repaired.split('\n').filter(l => l.trim() === '|')).toHaveLength(0);
    // Ensure all rows end with "|"
    const lines = repaired.split('\n');
    lines.forEach(line => {
      expect(line.startsWith('|')).toBe(true);
      expect(line.endsWith('|')).toBe(true);
    });
  });

  it('repairAllTablesInDocument preserves document headings and paragraphs outside tables', () => {
    const fullDoc = `# 10. Table / Comparison
Here is the core summary.

| Charge Component | Intraday Equity | Delivery Equity | Collecting Authority |
|---|---|---|---|
| **Brokerage** | Flat ₹20 | Zero | Stockbroker

### Important Note
Keep this handy.`;

    const processed = repairAllTablesInDocument(fullDoc);
    expect(processed).toContain('# 10. Table / Comparison');
    expect(processed).toContain('Here is the core summary.');
    expect(processed).toContain('### Important Note');
    expect(processed).toContain('Keep this handy.');
  });
});
