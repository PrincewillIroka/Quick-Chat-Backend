const generateChatUrl = () => {
  return Array(45)
    .fill(0)
    .map(() => Math.random().toString(36).charAt(2))
    .join("");
};

const valdateToken = () => {
  //To do validate token format with regex here
};

export { generateChatUrl };
