const express = require("express");
const cors = require("cors");
const multer = require("multer");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
const Joi = require("joi");

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "./public/images/desserts/"); },
    filename: (req, file, cb) => { cb(null, file.originalname); },
});

const upload = multer({ storage: storage });

const mongoose = require("mongoose");

mongoose
  .connect("mongodb+srv://brownks6:cUfIPBeFgFxFa94a@cluster0.z45odcu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected to mongodb..."))
  .catch((err) => console.error("could not connect ot mongodb...", err));

const squishSchema = new mongoose.Schema({
  name: String,
  img_name: String,
  description: String,
  ingredients: [String],
  instructions: [String]
});

const Squish = mongoose.model("Squish", squishSchema);

//READ
app.get("/api/squish", async (req, res) => {
    const squishes = await Squish.find();
    res.status(200).json(squishes);
});

//CREATE
app.post("/api/squish", upload.single("img"), async (req, res) => {
    const isValidRecipe = validateRecipe(req.body);
    if (isValidRecipe.error) {
        console.log("Invalid recipe");
        res.status(400).send(isValidRecipe.error.details[0].message);
        return;
    }
    const recipe = new Squish ({
        name: req.body.name,
        img_name: req.file ? `images/desserts/${req.file.filename}` : req.body.img_name,
        description: req.body.description,
        ingredients: req.body.ingredients.split("\n"),
        instructions: req.body.instructions.split("\n")
    });

    const newRecipe = await recipe.save();
    res.status(200).send(newRecipe);
});

const validateRecipe = (recipe) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        description: Joi.string().min(3).required(),
        ingredients: Joi.string().min(3).required(),
        instructions: Joi.string().min(3).required()
    });

    return schema.validate(recipe);
};

//EDIT
app.put("/api/squish/:id", upload.single("img"), async (req, res) => {
    const result = validateRecipe(req.body);
    if (result.error) return res.status(400).send(result.error.details[0].message);

    const fieldsToupdated = {
        name: req.body.name,
        description: req.body.description,
        ingredients: req.body.ingredients.split("\n"),
        instructions: req.body.instructions.split("\n"),
    };

    if (req.file) {
        fieldsToupdated.img_name = `images/desserts/${req.file.filename}`;
    }

    //squish[index] = updatedRecipe;
    const success = await Squish.updateOne({ _id: req.params.id }, fieldsToupdated);

    if (!success){
        res.status(404).send("Recipe not found");
        return;
    }

    const recipe = await Squish.findById(req.params.id);

    res.status(200).send(recipe);
});


//DELETE
app.delete("/api/squish/:id", async (req, res) => {
  const recipe = await Squish.findByIdAndDelete(req.params.id);

  if (!recipe) {
    res.status(404).send("Recipe not found");
    return;
  }

  res.status(200).send("Recipe deleted");
});


//READ
app.get("/api/squish/featured", (req, res) => {
    const featuredNames = [
        "Lemon Pound Cake",
        "Apple Pie",
        "Frosted Red Velvet Cookies",
        "Strawberry Shortcake"
    ];
    const featured = Squish.filter(r => featuredNames.includes(r.name));
    res.json(featured);
});


const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});