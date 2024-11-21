import React, { useState } from 'react';
import { setIcon } from 'obsidian';

interface MigrateMenuProps {
  onMigrate: () => Promise<void>;
}

const MigrateMenu: React.FC<MigrateMenuProps> = ({ onMigrate }: MigrateMenuProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <div className="p-2 cursor-pointer" onClick={() => setShowMenu(!showMenu)}>
        <span ref={el => el && setIcon(el, 'ellipsis-vertical')}></span>
      </div>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div 
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setShowMenu(false);
              onMigrate();
            }}
          >
            Migrate cards from obsidian-spaced-repetition
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrateMenu;
