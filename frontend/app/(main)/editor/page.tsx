'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Highlighter,
  Undo,
  Redo,
  Download,
  FileText,
  FileDown,
  ChevronDown,
  Languages,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
} from 'lucide-react';
import type { FileChild, ParagraphChild } from 'docx';
import { cn } from '@/lib/utils';

type TranslateApiResponse = {
  text?: string;
  detail?: string;
};

export default function EditorPage() {
  const [title, setTitle] = useState('Untitled Document');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [isTranslatingSelection, setIsTranslatingSelection] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [translationError, setTranslationError] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
  });

  const requestTranslation = useCallback(async (text: string) => {
    const response = await fetch('/editor/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const responseData = (await response.json().catch(() => ({}))) as TranslateApiResponse;

    if (!response.ok || typeof responseData.text !== 'string') {
      throw new Error(responseData.detail || 'Failed to translate text.');
    }

    return responseData.text;
  }, []);

  useEffect(() => {
    if (!editor) return;

    const syncSelectionState = () => {
      const { from, to } = editor.state.selection;
      const selectionText = editor.state.doc.textBetween(from, to, ' ').trim();

      if (from === to || !selectionText) {
        setSelectedText('');
        setSelectionRange(null);
        return;
      }

      setSelectedText(selectionText);
      setSelectionRange({ from, to });
    };

    syncSelectionState();
    editor.on('selectionUpdate', syncSelectionState);

    return () => {
      editor.off('selectionUpdate', syncSelectionState);
    };
  }, [editor]);

  const translateSelection = useCallback(async () => {
    if (!editor || !selectionRange || !selectedText) return;

    setTranslationError('');
    setIsTranslatingSelection(true);

    try {
      const translatedText = await requestTranslation(selectedText);

      editor
        .chain()
        .focus()
        .setTextSelection(selectionRange)
        .insertContent(translatedText)
        .run();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed.';
      setTranslationError(message);
    } finally {
      setIsTranslatingSelection(false);
    }
  }, [editor, requestTranslation, selectedText, selectionRange]);

  const translateFullText = useCallback(async () => {
    if (!editor) return;

    const fullText = editor.getText().trim();
    if (!fullText) {
      setTranslationError('Nothing to translate yet.');
      return;
    }

    setTranslationError('');
    setIsTranslatingAll(true);

    try {
      const translatedText = await requestTranslation(fullText);
      editor.chain().focus().selectAll().insertContent(translatedText).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Translation failed.';
      setTranslationError(message);
    } finally {
      setIsTranslatingAll(false);
    }
  }, [editor, requestTranslation]);

  const exportToPDF = useCallback(async () => {
    if (!editor) return;
    setIsExporting(true);
    
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      
      const content = editor.getHTML();
      const container = document.createElement('div');
      container.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; padding: 40px;">
          ${content}
        </div>
      `;
      
      const opt = {
        margin: 0.5,
        filename: `${title}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
      };
      
      await html2pdf().set(opt).from(container).save();
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  }, [editor, title]);

  const exportToDocx = useCallback(async () => {
    if (!editor) return;
    setIsExporting(true);
    
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');
      
      const htmlContent = editor.getHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const children: FileChild[] = [];
      
      // Parse HTML content to docx paragraphs
      const parseNode = (node: Node): FileChild[] => {
        const paragraphs: FileChild[] = [];
        
        if (node.nodeType === Node.TEXT_NODE) {
          return [];
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();
          
          if (tagName === 'p') {
            const textRuns: ParagraphChild[] = [];
            element.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                textRuns.push(new TextRun({ text: child.textContent || '' }));
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childEl = child as Element;
                const childTag = childEl.tagName.toLowerCase();
                const text = childEl.textContent || '';
                
                textRuns.push(new TextRun({
                  text,
                  bold: childTag === 'strong' || childTag === 'b',
                  italics: childTag === 'em' || childTag === 'i',
                  underline: childTag === 'u' ? {} : undefined,
                  strike: childTag === 's' || childTag === 'strike',
                  highlight: childTag === 'mark' ? 'yellow' : undefined,
                }));
              }
            });
            
            if (textRuns.length === 0) {
              textRuns.push(new TextRun({ text: element.textContent || '' }));
            }
            
            paragraphs.push(new Paragraph({ children: textRuns }));
          } else if (tagName === 'h1') {
            paragraphs.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_1,
            }));
          } else if (tagName === 'h2') {
            paragraphs.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_2,
            }));
          } else if (tagName === 'h3') {
            paragraphs.push(new Paragraph({
              text: element.textContent || '',
              heading: HeadingLevel.HEADING_3,
            }));
          } else if (tagName === 'ul' || tagName === 'ol') {
            element.querySelectorAll('li').forEach(li => {
              paragraphs.push(new Paragraph({
                text: li.textContent || '',
                bullet: tagName === 'ul' ? { level: 0 } : undefined,
                numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
              }));
            });
          } else if (tagName === 'blockquote') {
            paragraphs.push(new Paragraph({
              text: element.textContent || '',
              indent: { left: 720 },
              style: 'Quote',
            }));
          } else {
            element.childNodes.forEach(child => {
              paragraphs.push(...parseNode(child));
            });
          }
        }
        
        return paragraphs;
      };
      
      tempDiv.childNodes.forEach(node => {
        children.push(...parseNode(node));
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: children.length > 0 ? children : [
            ...children,
            new Paragraph({ text: '' }),
          ],
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title}.docx`);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  }, [editor, title]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between py-4 px-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground focus:ring-0 w-full max-w-md"
          placeholder="Document title..."
        />

        <div className="flex items-center gap-3">
          <button
            onClick={translateFullText}
            disabled={isTranslatingAll || isTranslatingSelection || isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-card-foreground rounded-xl font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isTranslatingAll ? (
              <>
                <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate Full Text
              </>
            )}
          </button>

          {/* Export Button */}
          <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting || isTranslatingAll || isTranslatingSelection}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity theme-shadow disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>

          {showExportMenu && !isExporting && (
            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl theme-shadow-lg overflow-hidden z-50 min-w-40">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-accent transition-colors"
              >
                <FileDown className="h-4 w-4 text-red-500" />
                Export as PDF
              </button>
              <button
                onClick={exportToDocx}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                Export as DOCX
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {translationError && (
        <div className="shrink-0 mb-3 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {translationError}
        </div>
      )}

      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-1 p-2 bg-card border border-border rounded-xl mb-4 theme-shadow">
        {/* Text Style */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* History */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {selectedText && (
          <>
            <ToolbarDivider />
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={translateSelection}
              disabled={isTranslatingSelection || isTranslatingAll || isExporting}
              className="ml-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isTranslatingSelection ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  Translating Selection...
                </>
              ) : (
                <>
                  <Languages className="h-3.5 w-3.5" />
                  Translate Selection
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden theme-shadow">
        <EditorContent editor={editor} className="h-full overflow-y-auto" />
      </div>

      {/* Word Count */}
      <div className="shrink-0 py-2 text-xs text-muted-foreground text-center">
        {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
        {' · '}
        {editor.getText().split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-2" />;
}
