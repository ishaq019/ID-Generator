const express = require("express");
const {
  createDigivalCardFromGoogleForm
} = require("../controllers/googleFormController");

const router = express.Router();

router.post("/digival-card", createDigivalCardFromGoogleForm);

module.exports = router;