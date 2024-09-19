import Markdown from 'react-markdown';


interface EntryViewProps {
    front: string,
    back: string, 
    showBack?: boolean
    handleFeedback?: (feedback: 'y' | 'n') => Promise<void>;
    handleFocus?: () => void;
    focused?: boolean,
    
}

export const EntryView: React.FC<EntryViewProps> = ({ 
    front, 
    back, 
    showBack = true,
    handleFeedback,
    handleFocus,
    focused = false, 
}: EntryViewProps) => {
    return (
        <div 
            className="bg-white bg-opacity-50 w-full max-w-lg p-6 h-auto min-h-48 flex flex-col justify-evenly border border-gray-300 rounded-md"
            onClick={handleFocus}
        >
        {handleFeedback && 
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
        }
            <Markdown>{front}</Markdown>
            {
                showBack &&
                <>
                    <div className="h-0.5 bg-gray-200" />
                    <Markdown>{back}</Markdown>
                </>
            }
        </div>
    );
}

export default EntryView;
