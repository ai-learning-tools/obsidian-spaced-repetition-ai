import * as React from 'react';

// This is a placeholder component for the card view in the chat flow. It is simple and meant to be replaced. 

export default function Entry({ front, back, handleFeedback, handleFocus, focused }: { 
  front: string, 
  back: string, 
  handleFeedback: (feedback: 'y' | 'n') => Promise<void>,
  handleFocus: () => void 
  focused: boolean,
}) {
  
  return (
    <div 
      className='my-4 p-4 border-2 text-center group'
      onClick={handleFocus}
    >
      <div 
      className={`float-right ${
          focused ? 'opacity-100 visible' : 'opacity-0 invisible'
        } group-hover:opacity-100 group-hover:visible`}>
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
      <p>{front}</p>
      <p>---</p>
      <p>{back}</p>
    </div>
  );
}