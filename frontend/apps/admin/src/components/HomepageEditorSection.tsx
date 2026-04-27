import React, { useEffect, useMemo, useState } from 'react';

import {
  deletePage,
  getPage,
  publishPage,
  savePage,
  unpublishPage,
  uploadFile,
} from '@tea-time/api-client';
import type {
  ButtonBlockProps,
  ContainerBlockProps,
  DividerBlockProps,
  HeadingBlockProps,
  ImageBlockProps,
  PageBlock,
  PageDocument,
  PageInput,
  ParagraphBlockProps,
  SectionBlockProps,
  SpacerBlockProps,
} from '@tea-time/types';
import { PageRenderer } from '@tea-time/ui';

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type BlockType = PageBlock['type'];

interface HomepageEditorSectionProps {
  onMessage?: (message: string) => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createId(prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function clonePage(page: PageDocument): PageDocument {
  return JSON.parse(JSON.stringify(page)) as PageDocument;
}

function toInput(page: PageDocument): PageInput {
  return {
    title: page.title,
    subtitle: page.subtitle,
    description: page.description,
    blocks: page.blocks,
  };
}

function isContainerBlock(block: PageBlock): block is Extract<PageBlock, { type: 'section' | 'container' }> {
  return block.type === 'section' || block.type === 'container';
}

function isTextBlock(block: PageBlock): block is Extract<PageBlock, { type: 'heading' | 'paragraph' }> {
  return block.type === 'heading' || block.type === 'paragraph';
}

function createBlock(type: BlockType): PageBlock {
  switch (type) {
    case 'section':
      return {
        type,
        id: createId('section'),
        props: {
          title: 'New section',
          subtitle: 'Section subtitle',
          description: 'Use this section to introduce a story, campaign, or content group.',
          eyebrow: 'Section',
          background_type: 'gradient',
          background_value: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
          overlay_color: 'rgba(17, 24, 18, 0.24)',
          text_color: '#ffffff',
          media_url: null,
          media_kind: null,
          primary_button_label: 'Primary action',
          primary_button_href: '#products',
          secondary_button_label: 'Secondary action',
          secondary_button_href: '#categories',
        },
        children: [],
      };
    case 'container':
      return {
        type,
        id: createId('container'),
        props: { layout: 'stack', gap: '16px' },
        children: [],
      };
    case 'heading':
      return {
        type,
        id: createId('heading'),
        props: { text: 'Heading text', level: 2, align: 'left' },
      };
    case 'paragraph':
      return {
        type,
        id: createId('paragraph'),
        props: { text: 'Paragraph copy goes here.', align: 'left' },
      };
    case 'image':
      return {
        type,
        id: createId('image'),
        props: {
          src: '/assets/home-Dr3wWsX4.webp',
          alt: 'Homepage image',
          caption: 'Editable media block',
        },
      };
    case 'button':
      return {
        type,
        id: createId('button'),
        props: {
          label: 'Call to action',
          href: '#account',
          variant: 'solid',
        },
      };
    case 'divider':
      return {
        type,
        id: createId('divider'),
        props: { style: 'line' },
      };
    case 'spacer':
      return {
        type,
        id: createId('spacer'),
        props: { height: 32 },
      };
    default:
      return {
        type: 'paragraph',
        id: createId('paragraph'),
        props: { text: 'Paragraph copy goes here.', align: 'left' },
      };
  }
}

function mapBlocks(blocks: PageBlock[], fn: (block: PageBlock) => PageBlock): PageBlock[] {
  return blocks.map((block) => {
    if (isContainerBlock(block)) {
      const nextChildren = mapBlocks(block.children, fn);
      const nextBlock = fn({ ...block, children: nextChildren });
      if (isContainerBlock(nextBlock)) {
        return { ...nextBlock, children: nextChildren };
      }
      return nextBlock;
    }
    return fn(block);
  });
}

function findBlock(blocks: PageBlock[], id: string): PageBlock | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (isContainerBlock(block)) {
      const child = findBlock(block.children, id);
      if (child) return child;
    }
  }
  return null;
}

function updateBlock(blocks: PageBlock[], id: string, updater: (block: PageBlock) => PageBlock): PageBlock[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return updater(block);
    }
    if (isContainerBlock(block)) {
      return { ...block, children: updateBlock(block.children, id, updater) };
    }
    return block;
  });
}

function removeBlock(blocks: PageBlock[], id: string): PageBlock[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => (isContainerBlock(block) ? { ...block, children: removeBlock(block.children, id) } : block));
}

function insertAfter(blocks: PageBlock[], targetId: string | null, nextBlock: PageBlock): PageBlock[] {
  if (!targetId) {
    return [...blocks, nextBlock];
  }

  const insertRecursive = (siblings: PageBlock[]): [PageBlock[], boolean] => {
    const next: PageBlock[] = [];
    let inserted = false;

    for (const block of siblings) {
      if (block.id === targetId) {
        next.push(block, nextBlock);
        inserted = true;
        continue;
      }

      if (isContainerBlock(block)) {
        const [children, childInserted] = insertRecursive(block.children);
        if (childInserted) {
          next.push({ ...block, children });
          inserted = true;
          continue;
        }
      }

      next.push(block);
    }

    return [next, inserted];
  };

  const [nextBlocks, inserted] = insertRecursive(blocks);
  return inserted ? nextBlocks : [...blocks, nextBlock];
}

function appendChild(blocks: PageBlock[], parentId: string, child: PageBlock): PageBlock[] {
  return blocks.map((block) => {
    if (block.id === parentId && isContainerBlock(block)) {
      return { ...block, children: [...block.children, child] };
    }
    if (isContainerBlock(block)) {
      return { ...block, children: appendChild(block.children, parentId, child) };
    }
    return block;
  });
}

function duplicateBlock(blocks: PageBlock[], id: string): PageBlock[] {
  const target = findBlock(blocks, id);
  if (!target) return blocks;

  const clone = JSON.parse(JSON.stringify(target)) as PageBlock;
  const relabel = (block: PageBlock): PageBlock => {
    const nextId = createId(block.type);
    if (isContainerBlock(block)) {
      return {
        ...block,
        id: nextId,
        children: block.children.map(relabel),
      };
    }
    return { ...block, id: nextId };
  };

  const copy = relabel(clone);

  const insertRecursive = (siblings: PageBlock[]): [PageBlock[], boolean] => {
    const next: PageBlock[] = [];
    let inserted = false;

    for (const block of siblings) {
      next.push(block);
      if (block.id === id) {
        next.push(copy);
        inserted = true;
        continue;
      }

      if (isContainerBlock(block)) {
        const [children, childInserted] = insertRecursive(block.children);
        if (childInserted) {
          next[next.length - 1] = { ...block, children };
          inserted = true;
        }
      }
    }

    return [next, inserted];
  };

  const [nextBlocks] = insertRecursive(blocks);
  return nextBlocks;
}

function moveBlock(blocks: PageBlock[], id: string, direction: 'up' | 'down'): PageBlock[] {
  const reorder = (siblings: PageBlock[]): PageBlock[] => {
    const index = siblings.findIndex((block) => block.id === id);
    if (index !== -1) {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= siblings.length) return siblings;
      const next = [...siblings];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    }

    return siblings.map((block) => (isContainerBlock(block) ? { ...block, children: reorder(block.children) } : block));
  };

  return reorder(blocks);
}

function updateBlockProps(blocks: PageBlock[], id: string, patch: Record<string, unknown>): PageBlock[] {
  return updateBlock(blocks, id, (block) => {
    if (block.type === 'section' || block.type === 'container' || isTextBlock(block) || block.type === 'image' || block.type === 'button' || block.type === 'divider' || block.type === 'spacer') {
      return {
        ...block,
        props: {
          ...(block.props as Record<string, unknown>),
          ...(patch.props ? (patch.props as Record<string, unknown>) : patch),
        },
      } as PageBlock;
    }
    return block;
  });
}

function snapshot(page: PageDocument | null) {
  return JSON.stringify(page ?? null);
}

function fallbackPage(): PageDocument {
  return {
    id: 'fallback-home',
    slug: 'home',
    title: 'Tea Time',
    subtitle: 'Homepage editor',
    description: 'A structured homepage built from blocks.',
    blocks: [createBlock('section')],
    is_published: false,
    published_on: null,
    created_on: '1970-01-01T00:00:00Z',
    modified_on: '1970-01-01T00:00:00Z',
  };
}

function getBlockTypeLabel(type: BlockType) {
  switch (type) {
    case 'section':
      return 'Section';
    case 'container':
      return 'Container';
    case 'heading':
      return 'Heading';
    case 'paragraph':
      return 'Text';
    case 'image':
      return 'Image';
    case 'button':
      return 'Button';
    case 'divider':
      return 'Divider';
    case 'spacer':
      return 'Spacer';
    default:
      return type;
  }
}

export function HomepageEditorSection({ onMessage }: HomepageEditorSectionProps) {
  const [draft, setDraft] = useState<PageDocument>(fallbackPage);
  const [baseline, setBaseline] = useState<PageDocument>(fallbackPage);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const selectedBlock = useMemo(() => findBlock(draft.blocks, selectedBlockId ?? ''), [draft.blocks, selectedBlockId]);
  const selectedIsContainer = selectedBlock ? isContainerBlock(selectedBlock) : false;
  const isDirty = snapshot(draft) !== snapshot(baseline);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      try {
        const page = await getPage('admin');
        if (!cancelled) {
          setDraft(clonePage(page));
          setBaseline(clonePage(page));
          setSelectedBlockId(null);
          setStatus('Homepage loaded.');
          onMessage?.('Homepage loaded.');
        }
      } catch (error) {
        if (!cancelled) {
          const next = fallbackPage();
          setDraft(next);
          setBaseline(next);
          setSelectedBlockId(null);
          const message = getErrorMessage(error);
          setStatus(message);
          onMessage?.(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [onMessage]);

  function commit(next: PageDocument | ((current: PageDocument) => PageDocument)) {
    setDraft((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      return clonePage(value);
    });
  }

  function patchPage(patch: Partial<PageDocument>) {
    commit((current) => ({ ...current, ...patch }));
  }

  function replaceBlocks(nextBlocks: PageBlock[]) {
    commit((current) => ({ ...current, blocks: nextBlocks }));
  }

  function handleBlockChange(id: string, patch: Partial<PageBlock>) {
    if ('props' in patch && patch.props) {
      replaceBlocks(updateBlockProps(draft.blocks, id, patch as Record<string, unknown>));
      return;
    }
    replaceBlocks(updateBlock(draft.blocks, id, (block) => ({ ...block, ...patch } as PageBlock)));
  }

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    if (selectedBlockId && selectedIsContainer) {
      replaceBlocks(appendChild(draft.blocks, selectedBlockId, block));
    } else if (selectedBlockId) {
      replaceBlocks(insertAfter(draft.blocks, selectedBlockId, block));
    } else {
      replaceBlocks([...draft.blocks, block]);
    }
    setSelectedBlockId(block.id);
  }

  function addChildBlock(type: BlockType) {
    if (!selectedBlockId || !selectedIsContainer) return;
    const block = createBlock(type);
    replaceBlocks(appendChild(draft.blocks, selectedBlockId, block));
    setSelectedBlockId(block.id);
  }

  async function uploadToBlock(blockId: string, field: 'src' | 'background' | 'media', file: File) {
    try {
      setStatus('Uploading media...');
      onMessage?.('Uploading media...');
      const response = await uploadFile(file);
      replaceBlocks(
        updateBlock(draft.blocks, blockId, (block) => {
          if (block.type === 'image') {
            return { ...block, props: { ...block.props, src: response.file_url, alt: file.name } };
          }
          if (block.type === 'section') {
            const props = block.props as SectionBlockProps;
            if (field === 'background') {
              return { ...block, props: { ...props, background_value: response.file_url } };
            }
            return { ...block, props: { ...props, media_url: response.file_url } };
          }
          return block;
        }),
      );
      setStatus('Media uploaded.');
      onMessage?.('Media uploaded.');
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus(message);
      onMessage?.(message);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await savePage(toInput(draft));
      const next = clonePage(saved);
      setDraft(next);
      setBaseline(next);
      setStatus('Homepage saved.');
      onMessage?.('Homepage saved.');
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus(message);
      onMessage?.(message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      await savePage(toInput(draft));
      const published = clonePage(await publishPage());
      setDraft(published);
      setBaseline(published);
      setStatus('Homepage published.');
      onMessage?.('Homepage published.');
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus(message);
      onMessage?.(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublish() {
    setSaving(true);
    try {
      await savePage(toInput(draft));
      const unpublished = clonePage(await unpublishPage());
      setDraft(unpublished);
      setBaseline(unpublished);
      setStatus('Homepage unpublished.');
      onMessage?.('Homepage unpublished.');
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus(message);
      onMessage?.(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete the homepage page document?')) return;
    setSaving(true);
    try {
      await deletePage();
      const next = fallbackPage();
      setDraft(next);
      setBaseline(next);
      setSelectedBlockId(null);
      setStatus('Homepage deleted and reset to defaults.');
      onMessage?.('Homepage deleted and reset to defaults.');
    } catch (error) {
      const message = getErrorMessage(error);
      setStatus(message);
      onMessage?.(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(clonePage(baseline));
    setSelectedBlockId(null);
    setStatus('Reverted to saved state.');
    onMessage?.('Reverted to saved state.');
  }

  function renderInspector() {
    if (!selectedBlock) {
      return (
        <div className="editor-inspector-group">
          <h4>Page settings</h4>
          <label>
            Title
            <input value={draft.title} onChange={(e) => patchPage({ title: e.target.value })} />
          </label>
          <label>
            Subtitle
            <input value={draft.subtitle ?? ''} onChange={(e) => patchPage({ subtitle: e.target.value })} />
          </label>
          <label>
            Description
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => patchPage({ description: e.target.value })}
              rows={5}
            />
          </label>
          <div className="editor-chip-row">
            <span className={`status-chip${draft.is_published ? ' is-active' : ''}`}>
              {draft.is_published ? 'Published' : 'Draft'}
            </span>
            {draft.published_on ? <span className="type-chip">Published on {draft.published_on}</span> : null}
          </div>
          <button type="button" className="danger" onClick={() => void handleDelete()}>
            Delete page
          </button>
        </div>
      );
    }

    if (selectedBlock.type === 'section') {
      const props = selectedBlock.props as SectionBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Section</h4>
          <label>
            Eyebrow
            <input
              value={props.eyebrow ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, eyebrow: e.target.value } })}
            />
          </label>
          <label>
            Title
            <input
              value={props.title ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, title: e.target.value } })}
            />
          </label>
          <label>
            Subtitle
            <input
              value={props.subtitle ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, subtitle: e.target.value } })}
            />
          </label>
          <label>
            Description
            <textarea
              value={props.description ?? ''}
              rows={4}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, description: e.target.value } })}
            />
          </label>
          <label>
            Background type
            <select
              value={props.background_type ?? 'gradient'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, background_type: e.target.value } })}
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Solid</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>
            Background value
            <input
              value={props.background_value ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, background_value: e.target.value } })}
            />
          </label>
          <label>
            Overlay color
            <input
              value={props.overlay_color ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, overlay_color: e.target.value } })}
            />
          </label>
          <label>
            Text color
            <input
              value={props.text_color ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, text_color: e.target.value } })}
            />
          </label>
          <label>
            Media kind
            <select
              value={props.media_kind ?? 'image'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, media_kind: e.target.value } })}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>
            Media URL
            <input
              value={props.media_url ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, media_url: e.target.value } })}
            />
          </label>
          <label className="upload-field">
            Upload media
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadToBlock(selectedBlock.id, 'media', file);
              }}
            />
          </label>
          <label>
            Primary label
            <input
              value={props.primary_button_label ?? ''}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, primary_button_label: e.target.value } })
              }
            />
          </label>
          <label>
            Primary href
            <input
              value={props.primary_button_href ?? ''}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, primary_button_href: e.target.value } })
              }
            />
          </label>
          <label>
            Secondary label
            <input
              value={props.secondary_button_label ?? ''}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, secondary_button_label: e.target.value } })
              }
            />
          </label>
          <label>
            Secondary href
            <input
              value={props.secondary_button_href ?? ''}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, secondary_button_href: e.target.value } })
              }
            />
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'container') {
      const props = selectedBlock.props as ContainerBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Container</h4>
          <label>
            Layout
            <select
              value={props.layout ?? 'stack'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, layout: e.target.value } })}
            >
              <option value="stack">Stack</option>
              <option value="grid">Grid</option>
            </select>
          </label>
          <label>
            Gap
            <input
              value={props.gap ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, gap: e.target.value } })}
            />
          </label>
          <button type="button" onClick={() => addChildBlock('heading')}>
            Add child block
          </button>
        </div>
      );
    }

    if (selectedBlock.type === 'heading') {
      const props = selectedBlock.props as HeadingBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Heading</h4>
          <label>
            Text
            <textarea
              rows={4}
              value={props.text}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, text: e.target.value } })}
            />
          </label>
          <label>
            Level
            <select
              value={props.level ?? 2}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, level: Number(e.target.value) as 1 | 2 | 3 } })
              }
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
          <label>
            Align
            <select
              value={props.align ?? 'left'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, align: e.target.value } })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'paragraph') {
      const props = selectedBlock.props as ParagraphBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Text</h4>
          <label>
            Copy
            <textarea
              rows={6}
              value={props.text}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, text: e.target.value } })}
            />
          </label>
          <label>
            Align
            <select
              value={props.align ?? 'left'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, align: e.target.value } })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'image') {
      const props = selectedBlock.props as ImageBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Image</h4>
          <label>
            Source URL
            <input
              value={props.src}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, src: e.target.value } })}
            />
          </label>
          <label className="upload-field">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadToBlock(selectedBlock.id, 'src', file);
              }}
            />
          </label>
          <label>
            Alt text
            <input
              value={props.alt}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, alt: e.target.value } })}
            />
          </label>
          <label>
            Caption
            <input
              value={props.caption ?? ''}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, caption: e.target.value } })}
            />
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'button') {
      const props = selectedBlock.props as ButtonBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Button</h4>
          <label>
            Label
            <input
              value={props.label}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, label: e.target.value } })}
            />
          </label>
          <label>
            Href
            <input
              value={props.href}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, href: e.target.value } })}
            />
          </label>
          <label>
            Variant
            <select
              value={props.variant ?? 'solid'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, variant: e.target.value } })}
            >
              <option value="solid">Solid</option>
              <option value="ghost">Ghost</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'divider') {
      const props = selectedBlock.props as DividerBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Divider</h4>
          <label>
            Style
            <select
              value={props.style ?? 'line'}
              onChange={(e) => handleBlockChange(selectedBlock.id, { props: { ...props, style: e.target.value } })}
            >
              <option value="line">Line</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
        </div>
      );
    }

    if (selectedBlock.type === 'spacer') {
      const props = selectedBlock.props as SpacerBlockProps;
      return (
        <div className="editor-inspector-group">
          <h4>Spacer</h4>
          <label>
            Height
            <input
              type="number"
              min="0"
              value={props.height}
              onChange={(e) =>
                handleBlockChange(selectedBlock.id, { props: { ...props, height: Number(e.target.value) || 0 } })
              }
            />
          </label>
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <section className="admin-page-section" id="admin-homepage">
        <article className="admin-card">
          <p className="section-kicker">Homepage</p>
          <h3>Loading editor</h3>
        </article>
      </section>
    );
  }

  return (
    <section className="admin-page-section homepage-editor-page" id="admin-homepage">
      <header className="homepage-editor-header">
        <div>
          <p className="section-kicker">Homepage</p>
          <h3>Structured page editor</h3>
          <p className="helper-copy">Build ordered sections and blocks, preview device sizes, and publish from the header.</p>
        </div>

        <div className="homepage-editor-actions">
          <span className={`status-chip${draft.is_published ? ' is-active' : ''}`}>
            {draft.is_published ? 'Published' : 'Draft'}
          </span>
          {isDirty ? <span className="type-chip">Unsaved changes</span> : null}
          <button type="button" className="secondary" onClick={() => void handleUnpublish()} disabled={saving}>
            Unpublish
          </button>
          <button type="button" className="secondary" onClick={handleCancel} disabled={!isDirty || saving}>
            Cancel
          </button>
          <button type="button" className="secondary" onClick={() => void handleSave()} disabled={!isDirty || saving}>
            Save
          </button>
          <button type="button" className="solid-button large" onClick={() => void handlePublish()} disabled={saving}>
            Publish
          </button>
        </div>
      </header>

      {status ? <p className="admin-banner-message">{status}</p> : null}

      <div className="homepage-editor-toolbar">
        <div className="editor-viewport-switcher" aria-label="Preview size">
          <button type="button" className={viewport === 'desktop' ? 'is-active' : ''} onClick={() => setViewport('desktop')}>
            Desktop
          </button>
          <button type="button" className={viewport === 'tablet' ? 'is-active' : ''} onClick={() => setViewport('tablet')}>
            Tablet
          </button>
          <button type="button" className={viewport === 'mobile' ? 'is-active' : ''} onClick={() => setViewport('mobile')}>
            Mobile
          </button>
        </div>
        <div className="editor-block-count">{draft.blocks.length} top-level blocks</div>
      </div>

      <div className="homepage-editor-shell">
        <aside className="homepage-editor-palette">
          <h4>Block palette</h4>
          <button type="button" onClick={() => addBlock('section')}>
            Section
          </button>
          <button type="button" onClick={() => addBlock('container')}>
            Container
          </button>
          <button type="button" onClick={() => addBlock('heading')}>
            Heading
          </button>
          <button type="button" onClick={() => addBlock('paragraph')}>
            Text
          </button>
          <button type="button" onClick={() => addBlock('image')}>
            Image
          </button>
          <button type="button" onClick={() => addBlock('button')}>
            Button
          </button>
          <button type="button" onClick={() => addBlock('divider')}>
            Divider
          </button>
          <button type="button" onClick={() => addBlock('spacer')}>
            Spacer
          </button>
          <p className="helper-copy">Select a section or container to add child blocks inside it.</p>
        </aside>

        <main className="homepage-editor-canvas">
          <PageRenderer
            page={draft}
            variant="preview"
            viewport={viewport}
            selectedBlockId={selectedBlockId}
            onBlockSelect={setSelectedBlockId}
            editable
            onBlockChange={handleBlockChange}
          />

          <div className="homepage-editor-selection-actions">
            <span className="type-chip">
              {selectedBlock ? `${getBlockTypeLabel(selectedBlock.type)} selected` : 'Page selected'}
            </span>
            {selectedBlock && isContainerBlock(selectedBlock) ? (
              <>
                <button type="button" onClick={() => addChildBlock('heading')}>
                  Add child
                </button>
                <button type="button" onClick={() => addChildBlock('paragraph')}>
                  Add text
                </button>
                <button type="button" onClick={() => addChildBlock('image')}>
                  Add image
                </button>
              </>
            ) : null}
            {selectedBlock ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    replaceBlocks(duplicateBlock(draft.blocks, selectedBlock.id));
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    replaceBlocks(moveBlock(draft.blocks, selectedBlock.id, 'up'));
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    replaceBlocks(moveBlock(draft.blocks, selectedBlock.id, 'down'));
                  }}
                >
                  Move down
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    replaceBlocks(removeBlock(draft.blocks, selectedBlock.id));
                    setSelectedBlockId(null);
                  }}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </main>

        <aside className="homepage-editor-inspector">
          <h4>{selectedBlock ? 'Block inspector' : 'Page inspector'}</h4>
          {renderInspector()}
        </aside>
      </div>
    </section>
  );
}
