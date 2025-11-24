'use client';

import { useState } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerComponentProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPickerComponent({ value, onChange }: EmojiPickerComponentProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          type="button"
        >
          <span className="text-2xl mr-2">{value}</span>
          <span className="text-muted-foreground flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Seleccionar emoji
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-0" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.AUTO}
          width={350}
          height={400}
          searchPlaceholder="Buscar emoji..."
          previewConfig={{
            showPreview: false,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

