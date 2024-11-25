import React from "react";
import { LinkedSlider } from "@/components/ui/linkedslider";
import { Button } from "@/components/ui/button";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunkSize: string;
  setChunkSize: (value: string) => void;
  chunkOverlap: string;
  setChunkOverlap: (value: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  chunkSize,
  setChunkSize,
  chunkOverlap,
  setChunkOverlap,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 text-black">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <LinkedSlider
          label="Chunk Size:"
          description="The maximum size of the chunks we are searching over, in tokens."
          min={1}
          max={3000}
          step={1}
          value={chunkSize}
          onChange={(value: string) => {
            setChunkSize(value);
          }}
          trackColor="bg-gray-300"
        />
        <LinkedSlider
          label="Chunk Overlap:"
          description="The maximum amount of overlap between chunks, in tokens."
          min={1}
          max={600}
          step={1}
          value={chunkOverlap}
          onChange={(value: string) => {
            setChunkOverlap(value);
          }}
          trackColor="bg-gray-300"
        />
        <Button onClick={onClose} className="mt-4 bg-gray-200 hover:bg-gray-300 text-black">
          Close
        </Button>
      </div>
    </div>
  );
};

export default SettingsModal; 