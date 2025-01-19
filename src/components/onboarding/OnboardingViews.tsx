import React, { useState } from 'react';
import { SRSettings } from '@/settings';
import EntryView from '@/components/EntryView';
import Markdown from 'react-markdown';
import { OnboardingStatus, DIRECTORY} from '@/constants';
import { Vault } from 'obsidian';

interface ImportViewProps {
  settings: SRSettings;
  updateOnboardingStatus: (status: OnboardingStatus) => void;
  vault: Vault;
}

const ImportView: React.FC<ImportViewProps> = ({ settings, updateOnboardingStatus }: ImportViewProps) => (
  <div className="flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold text-center">Welcome to Spaced Repetition AI ❤️</h1>
    
    <Markdown className="text-md">
      {`Detect cards in your notes using "\`${settings.inlineSeparator}\`" for single line cards and "\`${settings.multilineSeparator}\`" for multi-line cards. Card data will be stored in a folder called \`${DIRECTORY}\`.`}
    </Markdown>

    <div className="w-full space-y-4">
      <p className="font-semibold">Example for a single line card:</p>
      <EntryView
        front={`What is the answer to life, the universe and everything? ${settings.inlineSeparator} 42`}
        back=""
        showBack={false}
      />

      <p className="font-semibold mt-4">Example for a multi-line card:</p>
      <EntryView
        front={`Evergreen notes are:
${settings.multilineSeparator}
Atomic
Concept-oriented
Densely linked`}
        back=""
        showBack={false}
      />
    </div>

    <p className="text-md">
      You can update the separators in the Spaced Repetition AI plugin settings.
    </p>

    <button
      onClick={async () => {
          updateOnboardingStatus(OnboardingStatus.Done);
      }}
      className={`px-4 py-2 bg-white`}
    >
      Allow SR-AI to read and write cards to my notes
    </button>
  </div>
);

export default ImportView;
