import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPdfComments,
  savePdfComments,
  clearPdfComments,
  createPdfComment,
  updatePdfCommentInList,
  deletePdfCommentFromList,
  COMMENT_CATEGORIES,
  COMMENT_COLORS,
  PdfComment
} from './pdfCommentStorage';

describe('pdfCommentStorage', () => {
  const testDocId = 'doc_test_123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a new comment with valid normalized coordinates', () => {
    const comment = createPdfComment({
      docId: testDocId,
      pageNum: 1,
      x: 0.45,
      y: 0.62,
      text: 'Crucial 43rd amendment point',
      category: 'trap',
      color: 'amber'
    });

    expect(comment.id).toMatch(/^cmt_/);
    expect(comment.docId).toBe(testDocId);
    expect(comment.pageNum).toBe(1);
    expect(comment.x).toBe(0.45);
    expect(comment.y).toBe(0.62);
    expect(comment.text).toBe('Crucial 43rd amendment point');
    expect(comment.category).toBe('trap');
    expect(comment.color).toBe('amber');
    expect(comment.isOpen).toBe(true);
  });

  it('clamps coordinates within safe page boundaries (0.02 to 0.98)', () => {
    const outOfBounds = createPdfComment({
      docId: testDocId,
      pageNum: 2,
      x: -0.1,
      y: 1.5
    });

    expect(outOfBounds.x).toBe(0.02);
    expect(outOfBounds.y).toBe(0.98);
  });

  it('saves and loads comments from localStorage', () => {
    const c1 = createPdfComment({ docId: testDocId, pageNum: 1, x: 0.2, y: 0.3, text: 'Note 1' });
    const c2 = createPdfComment({ docId: testDocId, pageNum: 2, x: 0.5, y: 0.5, text: 'Note 2' });

    savePdfComments(testDocId, [c1, c2]);

    const loaded = loadPdfComments(testDocId);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].text).toBe('Note 1');
    expect(loaded[1].text).toBe('Note 2');
  });

  it('returns empty array when no comments exist for document', () => {
    const loaded = loadPdfComments('non_existent_doc');
    expect(loaded).toEqual([]);
  });

  it('updates a comment immutably in a list', () => {
    const c1 = createPdfComment({ docId: testDocId, pageNum: 1, x: 0.2, y: 0.3, text: 'Old text' });
    const list: PdfComment[] = [c1];

    const updatedList = updatePdfCommentInList(list, c1.id, {
      text: 'New updated text',
      category: 'trick'
    });

    expect(updatedList[0].text).toBe('New updated text');
    expect(updatedList[0].category).toBe('trick');
    expect(updatedList[0].updatedAt).toBeDefined();
    expect(list[0].text).toBe('Old text'); // original remains untouched
  });

  it('deletes a comment immutably from a list', () => {
    const c1 = createPdfComment({ docId: testDocId, pageNum: 1, x: 0.2, y: 0.3 });
    const c2 = createPdfComment({ docId: testDocId, pageNum: 1, x: 0.4, y: 0.5 });
    const list: PdfComment[] = [c1, c2];

    const afterDelete = deletePdfCommentFromList(list, c1.id);
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].id).toBe(c2.id);
  });

  it('clears all comments for a document', () => {
    const c1 = createPdfComment({ docId: testDocId, pageNum: 1, x: 0.2, y: 0.3 });
    savePdfComments(testDocId, [c1]);
    expect(loadPdfComments(testDocId)).toHaveLength(1);

    clearPdfComments(testDocId);
    expect(loadPdfComments(testDocId)).toEqual([]);
  });

  it('has valid metadata configurations for all categories and colors', () => {
    expect(COMMENT_CATEGORIES.note.icon).toBe('📝');
    expect(COMMENT_CATEGORIES.trap.icon).toBe('⚠️');
    expect(COMMENT_CATEGORIES.trick.icon).toBe('💡');
    expect(COMMENT_CATEGORIES.doubt.icon).toBe('❓');
    expect(COMMENT_CATEGORIES.important.icon).toBe('⭐');

    expect(COMMENT_COLORS.yellow.hex).toBe('#FACC15');
    expect(COMMENT_COLORS.amber.hex).toBe('#F59E0B');
  });
});
