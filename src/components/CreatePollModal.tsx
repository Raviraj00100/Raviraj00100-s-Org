import React from 'react';
import { PollCreateResult } from '../types.js';
import { CreatePollStudio } from './CreatePollStudio.js';
import { X, Sparkles } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCreated: (result: PollCreateResult) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose, onSuccessCreated }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-5xl bg-[#090714] rounded-3xl shadow-2xl border border-[rgba(167,139,250,0.22)] overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[rgba(167,139,250,0.18)] bg-[#100D20] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
              VoteSphere Poll Studio
            </span>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A5A0B5] hover:text-white rounded-xl hover:bg-[#17122A] transition-colors touch-target cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 bg-[#090714]">
          <CreatePollStudio
            onSuccessCreated={(result) => {
              onSuccessCreated(result);
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
