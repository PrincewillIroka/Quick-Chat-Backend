function myChats(req, res) {
  try {
    const bs_token = req.query.bs_token;
    console.log("bs_token", bs_token);

    res.send("Hey");
  } catch (error) {
    console.error(error);
    res.status(500);
  }
}

export { myChats };
