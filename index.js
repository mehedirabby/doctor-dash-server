const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const app = express();

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1dsbujx.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const appointmentOptionsCollection = client
      .db("doctorsPortal")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorsPortal")
      .collection("bookings");

    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      console.log(date);
      const query = {};
      const options = await appointmentOptionsCollection.find(query).toArray();
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const reminingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        option.slots = reminingSlots;
        console.log(bookedSlots, option.name, date, reminingSlots.length);
      });
      res.send(options);
    });

    /**
     * API naming convantion
     * bookings
     * app.get('/nookings)
     * app.get(/bookings/:id)
     * app.post('/bookings)
     * app.patch('/booking/:id)
     * app.delete('/bookings/:id')
     * *****/
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `you alreqady have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.log);
app.get("/", async (req, res) => {
  res.send("doctors portal server is running");
});
app.listen(port, () => {
  console.error(`doctor running on ${port}`);
});
