
//Format number inputs
export const MAX_INT64 = 9223372036854775807;

export const sanitizeNumber = (value) => {
  if (value === "" || value === null) return "";

  let num = Number(value);

  if (isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > MAX_INT64) return 0;

  return num;
};

export const blockInvalidChars = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};

//Delay
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));