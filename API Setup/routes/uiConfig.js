const express = require("express");

const router = express.Router();

router.get("/ui-config", (req, res) => {
  const showDevUserSwitcher = String(process.env.SHOW_DEV_USER_SWITCHER || "false").toLowerCase() === "true";

  res.json({
    showDevUserSwitcher,
  });
});

module.exports = router;
