// ============================================================
// src/components/RichTextEditor.tsx — TipTap rich text editor
// ============================================================

import React, { useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import {
  HiCode,
  HiLink,
  HiOutlinePhotograph,
  HiOutlineTable,
} from 'react-icons/hi';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdHighlight,
  MdFormatQuote,
  MdHorizontalRule,
  MdFormatClear,
  MdCode,
} from 'react-icons/md';

// ─── Toolbar button ───────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 text-sm
        ${active
          ? 'bg-primary-500/25 text-primary-300 shadow-glow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────
function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />;
}

// ─── Toolbar ──────────────────────────────────────────────────
function EditorToolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const headingBtn = (level: 1 | 2 | 3, label: string) => (
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
      active={editor.isActive('heading', { level })}
      title={`Heading ${level}`}
    >
      <span className="text-[11px] font-bold">{label}</span>
    </ToolbarButton>
  );

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-0.5 px-4 py-2 overflow-x-auto scrollbar-hide flex-wrap">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <span className="text-xs">↩</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <span className="text-xs">↪</span>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        {headingBtn(1, 'H1')}
        {headingBtn(2, 'H2')}
        {headingBtn(3, 'H3')}

        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <MdFormatBold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <MdFormatItalic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <MdFormatUnderlined className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <MdStrikethroughS className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <HiCode className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <MdHighlight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <MdFormatListBulleted className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <MdFormatListNumbered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <MdFormatAlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <MdFormatAlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <MdFormatAlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <MdFormatAlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <MdFormatQuote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <MdCode className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <MdHorizontalRule className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link & Image */}
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Insert Link"
        >
          <HiLink className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={insertImage}
          title="Insert Image"
        >
          <HiOutlinePhotograph className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={insertTable}
          title="Insert Table"
        >
          <HiOutlineTable className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          title="Clear Formatting"
        >
          <MdFormatClear className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

// ─── Main Editor Component ────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  editable?: boolean;
  onEditorReady?: (editor: Editor) => void;
}

export default function RichTextEditor({
  content,
  onContentChange,
  editable = true,
  onEditorReady,
}: RichTextEditorProps) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Color,
      TextStyle,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-content outline-none min-h-full',
      },
    },
    onUpdate: ({ editor: e }) => {
      if (isRemoteUpdate.current) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onContentChange(e.getHTML());
      }, 300);
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync external content changes (e.g., from WebSocket operations)
  useEffect(() => {
    if (!editor || !content) return;
    const currentHTML = editor.getHTML();
    if (currentHTML === content) return;

    isRemoteUpdate.current = true;
    const { from, to } = editor.state.selection;
    editor.commands.setContent(content, false);
    // Restore cursor position
    try {
      editor.commands.setTextSelection({ from, to });
    } catch { /* position may be out of bounds after update */ }
    requestAnimationFrame(() => {
      isRemoteUpdate.current = false;
    });
  }, [content, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {editable && <EditorToolbar editor={editor} />}

      {/* Paper area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 py-8 px-4">
        <div
          className="max-w-[816px] mx-auto bg-white rounded-sm shadow-sm
                     min-h-[1056px] p-16
                     border border-gray-200"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
}

export type { RichTextEditorProps };
export { EditorToolbar };
