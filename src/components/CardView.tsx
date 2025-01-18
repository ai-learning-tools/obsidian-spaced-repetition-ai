import React, { useEffect, useRef } from 'react';
import { RenderMarkdownWrapper } from '@/components/RenderMarkdownWrapper';
import SRPlugin from '@/main';

interface CardViewProps {
    front: string,
    back: string, 
    showBack?: boolean
    path: string;
    plugin: SRPlugin;
}

export const CardView: React.FC<CardViewProps> = ({ 
    front, 
    back, 
    showBack = true,
    path,
    plugin,
}: CardViewProps) => {
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderMarkdown = async () => {
            if (frontRef.current) {
                frontRef.current.innerHTML = ''; // Clear existing content
                const wrapper = new RenderMarkdownWrapper(plugin, path);
                await wrapper.renderMarkdownWrapper(front.trimStart(), frontRef.current);
            }
            if (showBack && backRef.current) {
                backRef.current.innerHTML = ''; // Clear existing content
                const wrapper = new RenderMarkdownWrapper(plugin, path);
                await wrapper.renderMarkdownWrapper(back.trimStart(), backRef.current);
            }
        };
        renderMarkdown();
    }, [front, back, showBack, path, plugin]);

    return (
        <div 
            className="theme-bg-surface theme-border w-full max-w-lg p-6 h-auto flex flex-col border rounded-md space-y-4"
        >
          <div ref={frontRef}></div>
          {
            showBack &&
            <>
                <div className="h-0.5 theme-divider" />
                <div ref={backRef}></div>
            </>
          }
        </div>
    );
}

export default CardView;
