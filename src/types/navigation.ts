export type RootTabParamList = {
  Home: undefined;
  Bible: {
    book?: string;
    chapter?: number;
    verse?: number;
    reference?: string;
  };
  Chat: {
    initialPrompt?: string;
  } | undefined;
  Notes: {
    prefilledNote?: {
      bookName: string;
      chapter: number;
      verse: number;
      title: string;
    };
  } | undefined;
};
