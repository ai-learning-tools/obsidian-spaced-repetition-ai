import React from 'react';
import Markdown from 'react-markdown';

interface EntryViewProps {
    front: string,
    back: string, 
    showBack?: boolean,
    handleFeedback?: (feedback: 'y' | 'n') => Promise<void>
}

export const EntryView: React.FC<EntryViewProps> = ({ 
    front, 
    back, 
    showBack = true,
    handleFeedback,
}: EntryViewProps) => {
    return (
        <div 
            className="theme-bg-surface theme-border w-full max-w-lg p-6 h-auto flex flex-col border rounded-md space-y-4"
        >
          {handleFeedback && 
            <div className='w-full flex justify-end'>
              <button
                className="mr-2 px-2 py-1 rounded theme-bg-surface theme-text theme-border theme-bg-hover"
                onClick={ async (e) => {await handleFeedback('n')}}
              >
                Remove
              </button>
              <button
                className="px-2 py-1 rounded theme-bg-surface theme-text theme-border theme-bg-hover"
                onClick={ async (e) => {await handleFeedback('y')}}
              >
                Add
              </button>
            </div>
          }
            <Markdown components={{
                p: ({children}) => <p className="whitespace-pre-wrap">{children}</p>,
                ul: ({children}) => <ul className="list-disc pl-4">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-4">{children}</ol>,
                li: ({children}) => <li className="mb-1">{children}</li>
            }}>{front}</Markdown>
          {
            showBack &&
            <>
                <div className="h-0.5 theme-divider" />
                <Markdown components={{
                    p: ({children}) => <p className="whitespace-pre-wrap">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-4">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4">{children}</ol>,
                    li: ({children}) => <li className="mb-1">{children}</li>
                }}>{back}</Markdown>
            </>
          }
        </div>
    );
}

export default EntryView;