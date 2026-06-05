const GeneratedCard = require("../models/GeneratedCard");
const Template = require("../models/Template");

exports.createGeneratedCard = async (req, res, next) => {
  try {
    const { templateId, formData = {}, photo = "", logo = "", qrData = "" } = req.body;

    if (!templateId) {
      res.status(400);
      throw new Error("Template ID is required");
    }

    const template = await Template.findById(templateId);

    if (!template) {
      res.status(404);
      throw new Error("Template not found");
    }

    const card = await GeneratedCard.create({
      templateId,
      formData,
      photo,
      logo,
      qrData,
      templateSnapshot: template.toObject()
    });

    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

exports.getGeneratedCards = async (req, res, next) => {
  try {
    const cards = await GeneratedCard.find()
  .populate("templateId", "templateName category orientation layoutKey slug")
  .sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    next(error);
  }
};

exports.getGeneratedCardById = async (req, res, next) => {
  try {
    const card = await GeneratedCard.findById(req.params.id).populate("templateId");

    if (!card) {
      res.status(404);
      throw new Error("Generated card not found");
    }

    res.json(card);
  } catch (error) {
    next(error);
  }
};

exports.updateGeneratedCard = async (req, res, next) => {
  try {
    const updatedCard = await GeneratedCard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedCard) {
      res.status(404);
      throw new Error("Generated card not found");
    }

    res.json(updatedCard);
  } catch (error) {
    next(error);
  }
};

exports.deleteGeneratedCard = async (req, res, next) => {
  try {
    const card = await GeneratedCard.findById(req.params.id);

    if (!card) {
      res.status(404);
      throw new Error("Generated card not found");
    }

    await card.deleteOne();
    res.json({ message: "Generated card deleted successfully" });
  } catch (error) {
    next(error);
  }
};
