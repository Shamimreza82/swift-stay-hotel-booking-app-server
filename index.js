const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors');
require('dotenv').config()
const port =  process.env.PORT || 5000


//middelwair
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173','http://localhost:5173' ],
    credentials: true
}))
app.use(cookieParser())


// token verify

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token; 
    console.log('value of token',token);
    if(!token){
      console.log(err);
      return res.status(401).send({massage: "not authorize"})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if(err){
        return res.status(401).send({massage: 'unauthorize'})
      }
      console.log("value in the token", decoded );
      req.user = decoded; 
      next()
    })
   
  }



//-------------------------------------------------------------------------------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rt8iygl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // collection data 

    const roomsCollections = client.db("roomsDB").collection("rooms")
    const bookingCollections = client.db("roomsDB").collection("booking")




    // jwt 
    app.post('/api/v1/auth/access-token', async (req, res) => {
        const user = req.body; 
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'} )
        res
        .cookie('token', token, {
          httpOnly: true, 
          secure: false, 
        })
        .send({success: true})
    })


    app.post('/api/v1/logout', async(req, res) => {
        const user = req.body 
        res.clearCookie('token', {maxAge: 0})
    })


    /// rooms related route
    app.get('/api/v1/rooms', async(req, res) => {
        const result = await roomsCollections.find().toArray()
        res.send(result)
    })

    app.get('/api/v1/room/:id', async(req, res) => {
        const id = req.params.id
        console.log(id);
        const query = {_id: new ObjectId(id)}
        const result = await roomsCollections.findOne(query)
        res.send(result)
    })

    app.post('/api/v1/booking',async (req, res) => {
        const booking = req.body
        console.log(booking);
        const result = await bookingCollections.insertOne(booking)
        res.send(result)
    })

    app.get('/api/v1/bookings', verifyToken,  async (req, res) => {
        console.log("ssssssssssss",req.query.email);
        console.log(" veryfy Token", req.user.email);
        if(req.query?.email !== req.user?.email){
            return res.status(401).send({message: "unauthorize"})
          }
              let query = {}
            if(req.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingCollections.find(query).toArray()
            res.send(result)
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//----------------------------------------------------------------------------------------------


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})