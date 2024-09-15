interface CardViewProps {
    front: string,
    back: string, 
    showBack?: boolean
}

export const CardView: React.FC<CardViewProps> = ({front, back, showBack = false}: CardViewProps) => {
    return (
        <div className="bg-gray-100 w-full max-w-lg p-6 h-auto min-h-48 flex flex-col justify-evenly border border-gray-100 rounded-md">
        <p>
            {front}
        </p>
        {
            showBack &&
            <>
                <div className="h-0.5 bg-gray-200"/>
                <p>
                    {back}
                </p>
            </>
        }
       
    </div>
    );
}

export default CardView;
