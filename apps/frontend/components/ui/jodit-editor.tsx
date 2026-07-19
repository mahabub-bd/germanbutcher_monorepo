"use client";

import { cn } from "@/lib/utils";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Enter image URL:");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("bold") && "bg-gray-300"
        )}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("italic") && "bg-gray-300"
        )}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("underline") && "bg-gray-300"
        )}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("strike") && "bg-gray-300"
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("code") && "bg-gray-300"
        )}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("heading", { level: 1 }) && "bg-gray-300"
        )}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("heading", { level: 2 }) && "bg-gray-300"
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("blockquote") && "bg-gray-300"
        )}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("bulletList") && "bg-gray-300"
        )}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("orderedList") && "bg-gray-300"
        )}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive({ textAlign: "left" }) && "bg-gray-300"
        )}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive({ textAlign: "center" }) && "bg-gray-300"
        )}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive({ textAlign: "right" }) && "bg-gray-300"
        )}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive({ textAlign: "justify" }) && "bg-gray-300"
        )}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={setLink}
        className={cn(
          "p-2 rounded hover:bg-gray-200 transition-colors",
          editor.isActive("link") && "bg-gray-300"
        )}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded hover:bg-gray-200 transition-colors"
        title="Add Image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing here...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
          "bg-white"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Sync external value changes to editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "border border-gray-300 rounded-lg overflow-hidden",
        className
      )}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
