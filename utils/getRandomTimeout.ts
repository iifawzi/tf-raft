// Randomized election timeouts to ensure split votes are rare (Ch. 3.4)
export const getRandomTimeout = (min: number, max: number) => Math.round(Math.random() * min + (max - min));