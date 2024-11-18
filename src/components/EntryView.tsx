import React, { useEffect, useRef } from 'react';
import { RenderMarkdownWrapper } from '@/components/RenderMarkdownWrapper';
import SRPlugin from '@/main';

interface EntryViewProps {
    front: string,
    back: string, 
    showBack?: boolean
    handleFeedback?: (feedback: 'y' | 'n') => Promise<void>;
    path: string;
    plugin: SRPlugin;
}

export const EntryView: React.FC<EntryViewProps> = ({ 
    front, 
    back, 
    showBack = true,
    handleFeedback,
    path,
    plugin,
}: EntryViewProps) => {
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
          {handleFeedback && 
            <div className='w-full flex justify-end'>
              <button
                className="mr-2 px-2 py-1 rounded !bg-red-300 text-neutral-600"
                onClick={ async (e) => {await handleFeedback('n')}}
              >
                Remove
              </button>
              <button
                className="px-2 py-1 rounded !bg-green-300 text-neutral-600"
                onClick={ async (e) => {await handleFeedback('y')}}
              >
                Add
              </button>
            </div>
          }
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

export default EntryView;
