const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { check, validationResult } = require('express-validator');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const Schema = mongoose.Schema;

const workoutSchema = new Schema({
  exerciseName: String,
  exerciseDate: Date,
  exerciseDuration: Number,
});

const Workout = mongoose.model('Workout', workoutSchema);

mongoose.connect('mongodb://localhost:27017/workoutTrackerDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.formatDate = (date) => {
  const formattedDate = new Date(date).toISOString().split('T')[0];
  return formattedDate;
};


const validateInputs = [
  check('exerciseName').notEmpty().withMessage('Exercise name is required'),
  check('exerciseDate').isDate().withMessage('Invalid date format'),
  check('exerciseDuration').isNumeric().withMessage('Duration should be a number'),
];

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/workouts', async (req, res) => {
  try {
    const workouts = await Workout.find();
    res.render('workout', { workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/workouts/create', (req, res) => {
  res.render('create-workout');
});

app.post('/workouts/create', validateInputs, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const newWorkout = new Workout({
    exerciseName: req.body.exerciseName,
    exerciseDate: req.body.exerciseDate,
    exerciseDuration: req.body.exerciseDuration,
  });

  try {
    await newWorkout.save();
    res.redirect('/workouts');
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/workouts/view/:id', async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      res.status(404).send('Workout not found');
    } else {
      res.render('view-workout', { workout });
    }
  } catch (error) {
    console.error('Error fetching workout details:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/workouts/edit/:id', async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) {
      res.status(404).send('Workout not found');
    } else {
      res.render('edit-workout', { workout });
    }
  } catch (error) {
    console.error('Error fetching workout details:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/workouts/edit/:id', validateInputs, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { exerciseName, exerciseDate, exerciseDuration } = req.body;

  try {
    const updatedWorkout = await Workout.findByIdAndUpdate(req.params.id, {
      exerciseName,
      exerciseDate,
      exerciseDuration,
    }, { new: true });

    if (!updatedWorkout) {
      res.status(404).send('Workout not found');
    } else {
      res.redirect('/workouts');
    }
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
