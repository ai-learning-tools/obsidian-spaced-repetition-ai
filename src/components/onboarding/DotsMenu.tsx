import { useState } from 'react';
import { setIcon } from 'obsidian';

const DotsMenu = () => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <div className="p-2 cursor-pointer" onClick={() => setShowMenu(!showMenu)}>
        <span ref={el => el && setIcon(el, 'ellipsis-vertical')}></span>
      </div>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 theme-bg-surface theme-border border rounded-md shadow-lg z-10">
          <div 
            className="px-4 py-2 theme-text theme-bg-hover cursor-pointer"
            onClick={() => {
              setShowMenu(false);
              window.open('https://github.com/ai-learning-tools/obsidian-spaced-repetition-ai', '_blank'); 
            }}
          >
            About Spaced Repetition AI
          </div>
        </div>
      )}
    </div>
  );
};

export default DotsMenu;
