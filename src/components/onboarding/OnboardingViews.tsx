import React, { useState } from 'react';
import { SRSettings } from '@/settings';
import EntryView from '@/components/EntryView';
import Markdown from 'react-markdown';
import { OnboardingStatus, DIRECTORY} from '@/constants';
import { Vault } from 'obsidian';
import { countOldSRCards } from '@/utils/pluginPort/index';

const ImportView: React.FC<{ 
  settings: SRSettings; 
  updateOnboardingStatus: React.Dispatch<React.SetStateAction<OnboardingStatus>>;
  setNCardsMigrate: React.Dispatch<React.SetStateAction<number | null>>;
  vault: Vault;
}> = ({ settings, updateOnboardingStatus, setNCardsMigrate, vault }) => (
  <div className="flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold text-center">👋 Welcome to Spaced Repetition AI!</h1>
    
    <Markdown className="text-md">
      {`Detect cards in your notes using \`${settings.inlineSeparator}\` for single line cards and \`${settings.multilineSeparator}\` for multi-line cards. Card data will be stored in the folder \`${DIRECTORY}\`.`}
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
        const nCardsMigrate = await countOldSRCards(vault);
        setNCardsMigrate(nCardsMigrate);
        if (nCardsMigrate > 0) {
          updateOnboardingStatus(OnboardingStatus.Migrate);
        } else {
          updateOnboardingStatus(OnboardingStatus.Done);
        }
      }}
      className={`px-4 py-2 bg-white`}
    >
      Allow SR-AI to read and write cards to my notes
    </button>
  </div>
);
const MigrateView: React.FC<{
  settings: SRSettings;
  updateOnboardingStatus: React.Dispatch<React.SetStateAction<OnboardingStatus>>;
  nCardsMigrate: number;
}> = ({ settings, updateOnboardingStatus, nCardsMigrate }) => (
  <div className="flex flex-col items-center justify-center p-6 space-y-6 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold text-center"> Migrate from the obsidian-spaced-repetition plugin</h1>

    <Markdown className="text-md">
      {nCardsMigrate === 0
        ? `We haven't detected any existing card data from the \`obsidian-spaced-repetition\` plugin.`
        : nCardsMigrate === 1
        ? `We've detected existing card data from the \`obsidian-spaced-repetition\` plugin for 1 card using the \`${settings.inlineSeparator}\` single line or \`${settings.multilineSeparator}\` multi-line separator.`
        : `We've detected existing card data from the \`obsidian-spaced-repetition\` plugin for ${nCardsMigrate} cards using the \`${settings.inlineSeparator}\` single line or \`${settings.multilineSeparator}\` multi-line separator.`}
    </Markdown>

    <p className="text-md">Would you like to migrate this card data? You may want to back up your vault first.</p>

    <div className="flex space-x-4">
      <button
        onClick={() => {
          // TODO: Implement migration logic here
          updateOnboardingStatus(OnboardingStatus.Done);
        }}
        className={`px-4 py-2 bg-white`}
      >
        Yes, migrate cards
      </button>
      <button
        onClick={() => {
          updateOnboardingStatus(OnboardingStatus.Done);
        }}
        className={`px-4 py-2 bg-white`}
      >
        No, maybe later
      </button>
    </div>
  </div>
);


export { ImportView, MigrateView };
