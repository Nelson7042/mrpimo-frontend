export const truncateSentence = (sentence: string, length: number): string => {
  return sentence.length > length
    ? sentence.slice(0, length) + "..."
    : sentence;
};
