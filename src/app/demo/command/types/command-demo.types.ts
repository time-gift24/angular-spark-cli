export interface CommandItem {
  label: string;
  value: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  description?: string;
  keywords?: string[];
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}
