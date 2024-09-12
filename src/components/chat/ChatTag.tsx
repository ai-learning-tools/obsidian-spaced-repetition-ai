import * as React from 'react';
import { CloseIcon } from '../Icons';

export default function ChatTag({ name, handleRemove, handleClick }: { name: string, handleRemove?: () => void, handleClick?: () => void }) {
  return (
    <div 
      className={`bg-white px-4 py-1 m-2 border rounded-lg  inline-flex items-center justify-between ${handleClick && 'cursor-pointer'}`}
      onClick={() => {handleClick && handleClick()}}
    >
      <span>{name}</span>
      {handleRemove && (
        <span className="ml-2 float-right cursor-pointer" onClick={handleRemove}><CloseIcon /></span>
      )}
    </div>
  )
}