import * as React from 'react';
import { CloseIcon } from '../Icons';

export default function ChatTag({ name, handleRemove, handleClick }: { name: string, handleRemove?: () => void, handleClick?: () => void }) {
  return (
    <div 
      className={`theme-bg-surface theme-border px-4 py-1 m-2 border rounded-lg inline-flex items-center justify-between ${handleClick && 'cursor-pointer theme-bg-hover'}`}
      onClick={() => {handleClick && handleClick()}}
    >
      <span className="whitespace-pre-wrap theme-text">{name}</span>
      {handleRemove && (
        <span className="ml-2 float-right cursor-pointer theme-text-faint" onClick={handleRemove}><CloseIcon /></span>
      )}
    </div>
  )
}