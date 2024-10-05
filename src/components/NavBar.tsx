import * as React from 'react';
import { SubviewType } from '@/constants';

interface NavBarProps {
  currentSubview: SubviewType;
  changeSubview: (subview: SubviewType) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentSubview, changeSubview }) => {

  return (
    <div className="flex flex-row items-center justify-center space-x-4 text-neutral-400 mb-2">
      <div
        onClick={() => changeSubview(SubviewType.CHAT)}
        className={`cursor-pointer p-1 rounded-md hover:bg-gray-200 transition-colors ${
          currentSubview === SubviewType.CHAT
            ? 'bg-purple-100'
            : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${
            currentSubview === SubviewType.CHAT
              ? 'text-purple-500'
              : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <div
        onClick={() => changeSubview(SubviewType.REVIEW)}
        className={`cursor-pointer p-1 rounded-md hover:bg-gray-200 transition-colors ${
          currentSubview === SubviewType.REVIEW
            ? 'bg-purple-100'
            : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${
            currentSubview === SubviewType.REVIEW
              ? 'text-purple-500'
              : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18h12"
          />
        </svg>
      </div>
    </div>
  );
};

export default NavBar;