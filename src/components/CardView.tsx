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
            if (frontRef.current && !frontRef.current.hasChildNodes()) {
                const wrapper = new RenderMarkdownWrapper(plugin, path);
                await wrapper.renderMarkdownWrapper(front.trimStart(), frontRef.current);
            }
            if (showBack && backRef.current && !backRef.current.hasChildNodes()) {
                const wrapper = new RenderMarkdownWrapper(plugin, path);
                await wrapper.renderMarkdownWrapper(back.trimStart(), backRef.current);
            }
        };
        renderMarkdown();
    }, [front, back, showBack]);

    return (
        <div 
            className="bg-white bg-opacity-50 w-full max-w-lg p-6 h-auto flex flex-col border border-gray-300 rounded-md space-y-4"
        >
          <div ref={frontRef}></div>
          {
            showBack &&
            <>
                <div className="h-0.5 bg-gray-200" />
                <div ref={backRef}></div>
            </>
          }
        </div>
    );
}

export default CardView;
