import React, { useCallback } from 'react';
import type { BannerInput, UploadResponse } from '@tea-time/types';
import { uploadFile } from '@tea-time/api-client';

export type BlockType = 'heading' | 'paragraph' | 'image' | 'button' | 'spacer' | 'divider';

export interface BannerBlock {
    id: string;
    type: BlockType;
    content: any;
}

interface VisualBannerEditorProps {
    bannerForm: BannerInput;
    onChange: (patch: Partial<BannerInput>) => void;
    onMessage?: (msg: string) => void;
    blocks: BannerBlock[];
    onUpdateBlocks: (newBlocks: BannerBlock[]) => void;
}

export function BannerBlockPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
    return (
        <div className="block-palette-content">
            <button type="button" className="block-template" onClick={() => onAdd('heading')}>
                <span className="block-icon">H</span> Heading
            </button>
            <button type="button" className="block-template" onClick={() => onAdd('paragraph')}>
                <span className="block-icon">P</span> Text Paragraph
            </button>
            <button type="button" className="block-template" onClick={() => onAdd('image')}>
                <span className="block-icon">🖼️</span> Image
            </button>
            <button type="button" className="block-template" onClick={() => onAdd('button')}>
                <span className="block-icon">🔗</span> Button
            </button>
            <button type="button" className="block-template" onClick={() => onAdd('spacer')}>
                <span className="block-icon">↕️</span> Spacer
            </button>
            <button type="button" className="block-template" onClick={() => onAdd('divider')}>
                <span className="block-icon">➖</span> Divider
            </button>
        </div>
    );
}

export function VisualBannerEditor({ bannerForm, onChange, onMessage, blocks, onUpdateBlocks }: VisualBannerEditorProps) {
    const generateHtml = useCallback((currentBlocks: BannerBlock[]) => {
        return currentBlocks.map(block => {
            switch (block.type) {
                case 'heading':
                    return `<div class="banner-block-heading"><h2 style="margin: 0 0 1rem; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 2.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.04em;">${block.content}</h2></div>`;
                case 'paragraph':
                    return `<div class="banner-block-text"><p style="margin: 0 0 1.5rem; font-size: 1.1rem; line-height: 1.6; opacity: 0.9;">${block.content}</p></div>`;
                case 'image':
                    return `<div class="banner-block-image"><img src="${block.content.src}" alt="${block.content.alt}" style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;" /></div>`;
                case 'button':
                    return `<div class="banner-block-actions"><a href="${block.content.href}" style="display: inline-block; padding: 14px 28px; background: white; color: #111812; border-radius: 999px; text-decoration: none; font-weight: 800; font-size: 0.9rem; margin-right: 12px; margin-bottom: 1rem;">${block.content.label}</a></div>`;
                case 'spacer':
                    return `<div class="banner-block-spacer" style="height: ${block.content || '2rem'}"></div>`;
                case 'divider':
                    return `<div class="banner-block-divider"><hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0;" /></div>`;
                default:
                    return '';
            }
        }).join('\n');
    }, []);

    const updateBlocks = (newBlocks: BannerBlock[]) => {
        onUpdateBlocks(newBlocks);
        onChange({
            content_json: newBlocks,
            content_html: generateHtml(newBlocks)
        });
    };

    const removeBlock = (id: string) => {
        updateBlocks(blocks.filter((b: BannerBlock) => b.id !== id));
    };

    const moveBlock = (id: string, dir: 'up' | 'down') => {
        const idx = blocks.findIndex((b: BannerBlock) => b.id === id);
        if (idx === -1) return;
        if (dir === 'up' && idx === 0) return;
        if (dir === 'down' && idx === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
        [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
        updateBlocks(newBlocks);
    };

    const updateBlockContent = (id: string, content: any) => {
        updateBlocks(blocks.map((b: BannerBlock) => b.id === id ? { ...b, content } : b));
    };

    const handleImageUpload = async (id: string, file: File) => {
        try {
            onMessage?.('Uploading image...');
            const response: UploadResponse = await uploadFile(file);
            updateBlockContent(id, { src: response.file_url, alt: file.name });
            onMessage?.('Image uploaded.');
        } catch (error) {
            onMessage?.('Upload failed: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    return (
        <div className="visual-editor-integrated">
            <div className="visual-editor-canvas">
                {blocks.map((block: BannerBlock) => (
                    <div key={block.id} className="editor-block">
                        <div className="block-controls">
                            <button type="button" className="block-control-btn" onClick={() => moveBlock(block.id, 'up')}>↑</button>
                            <button type="button" className="block-control-btn" onClick={() => moveBlock(block.id, 'down')}>↓</button>
                            <button type="button" className="block-control-btn danger" onClick={() => removeBlock(block.id)}>✕</button>
                        </div>

                        {block.type === 'heading' && (
                            <div
                                className="block-content-editable h2"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateBlockContent(block.id, e.currentTarget.textContent)}
                            >
                                {block.content}
                            </div>
                        )}

                        {block.type === 'paragraph' && (
                            <div
                                className="block-content-editable p"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => updateBlockContent(block.id, e.currentTarget.textContent)}
                            >
                                {block.content}
                            </div>
                        )}

                        {block.type === 'image' && (
                            <div className="block-image-container">
                                {block.content.src ? (
                                    <div className="image-preview-wrapper">
                                        <img src={block.content.src} alt={block.content.alt} className="block-image-preview" />
                                        <button type="button" className="change-img-btn" onClick={() => updateBlockContent(block.id, { src: '', alt: '' })}>Change Image</button>
                                    </div>
                                ) : (
                                    <label className="block-image-placeholder">
                                        <span>Click or drop image here</span>
                                        <input
                                            type="file"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(block.id, file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                        )}

                        {block.type === 'button' && (
                            <div className="block-button-editor">
                                <input
                                    type="text"
                                    placeholder="Label"
                                    value={block.content.label}
                                    onChange={(e) => updateBlockContent(block.id, { ...block.content, label: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="URL"
                                    value={block.content.href}
                                    onChange={(e) => updateBlockContent(block.id, { ...block.content, href: e.target.value })}
                                />
                            </div>
                        )}

                        {block.type === 'spacer' && (
                            <div className="block-spacer-editor">
                                <input
                                    type="text"
                                    value={block.content}
                                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                    placeholder="2rem"
                                />
                                <div style={{ height: block.content || '2rem', border: '1px dashed var(--line)', margin: '10px 0' }} />
                            </div>
                        )}

                        {block.type === 'divider' && (
                            <div className="block-divider-editor">
                                <hr />
                            </div>
                        )}
                    </div>
                ))}

                {blocks.length === 0 && (
                    <div className="canvas-empty-state">
                        <p>Drag blocks from the palette to start building.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
