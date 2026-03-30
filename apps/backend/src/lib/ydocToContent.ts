/**
 * Y.Doc ↔ plain-text content converters.
 *
 * The collaboration editor uses a Yjs shared text type (`Y.Text`).  When
 * persisting back to `Blog.content` (Markdown string), we simply read the
 * text out of the Y.Doc.  When initialising a Y.Doc from an existing blog,
 * we insert the content string into the shared text type.
 */

import * as Y from 'yjs';

/**
 * Extract the plain-text / markdown content from a Y.Doc.
 * The collaborative editor stores text in a Y.Text named "content".
 */
export function ydocToMarkdown(ydoc: Y.Doc): string {
  const ytext = ydoc.getText('content');
  return ytext.toJSON();
}

/**
 * Initialise a Y.Doc's shared text type from an existing Markdown string.
 * This is used when a blog is opened in collab mode for the first time.
 */
export function contentToYdoc(content: string, ydoc?: Y.Doc): Y.Doc {
  const doc = ydoc || new Y.Doc();
  const ytext = doc.getText('content');
  if (ytext.length === 0 && content) {
    ytext.insert(0, content);
  }
  return doc;
}

/**
 * Decode a stored Y.Doc binary (Buffer / Uint8Array) and return the markdown.
 */
export function decodeYdocToMarkdown(binary: Buffer | Uint8Array): string {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(binary));
  return ydocToMarkdown(doc);
}
