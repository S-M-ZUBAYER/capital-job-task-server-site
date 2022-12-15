const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRETE);
const port = process.env.PORT || 5000;


const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unAuthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p2sr91x.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const productCategoriesCollections = client.db('Cricket_Lover').collection('categories');
        const productsCollections = client.db('Cricket_Lover').collection('products');
        const bookingCollections = client.db('Cricket_Lover').collection('bookings');
        const usersCollections = client.db('Cricket_Lover').collection('users');
        const paymentsCollection = client.db('Cricket_Lover').collection('payments');

        console.log('database connected ')

        //users info
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await usersCollections.updateOne(filter, updateDoc, options);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '7d'
            });

            res.send({ result, token });
        });


        // update for advertise
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await productsCollections.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.put('/productBook/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: false,
                    available: false,
                    sold: true
                }
            }
            const result = await productsCollections.updateOne(filter, updatedDoc, options);
            res.send(result);
        })


        app.get('/products/:category', async (req, res) => {
            const categoryName = req?.params?.category;
            const query = {
                category: categoryName
            }
            const products = await productsCollections.find(query).toArray();
            res.send(products);
        })

        //find all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await productCategoriesCollections.find(query).toArray();
            res.send(categories);
        })
        //find all products
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollections.find(query).toArray();
            res.send(products);
        })


        //my orders
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email };
            const bookings = await bookingCollections.find(query).toArray();
            res.send(bookings);
        });
        app.get('/products/:email', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email };
            const myProducts = await productsCollections.find(query).toArray();
            res.send(myProducts);
        });

        // got specific booking data
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollections.findOne(query);
            res.send(booking);
        })
        app.put('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true
                }
            }
            const result = await bookingCollections.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //my products
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email };
            const products = await productsCollections.find(query).toArray();
            res.send(products);
        });


        // add product 
        app.post('/products', async (req, res) => {
            const user = req.body;
            const result = await productsCollections.insertOne(user);
            res.send(result);
        });

        // booking 
        app.post('/bookings', async (req, res) => {
            const user = req.body;
            const result = await bookingCollections.insertOne(user);
            res.send(result);
        });


        //all users
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollections.find(query).toArray();
            res.send(users)
        })

        //one user info
        app.get('/user', async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            res.send(user);
        });


        // delete user
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollections.deleteOne(filter);
            res.send(result)
        });

        //delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollections.deleteOne(filter);
            res.send(result)
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollections.findOne(query);
            res.send(user);
        })
        // payment setup
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                'payment_method_types': [
                    'card'
                ]

            })
            res.send({
                clientSecret: paymentIntent.client_secret
            });
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await paymentsCollection.updateOne(filter, updateDoc)
            res.send(result);
        })

        // admin role   verifyJWT, verifyAdmin,

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollections.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollections.findOne(query);
            res.send({ isBuyer: user?.accountType === 'Buyer' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollections.findOne(query);
            res.send({ isSeller: user?.accountType === 'Seller' });
        })

        app.put('/users/admin/:id', async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollections.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollections.updateOne(filter, updateDoc, options);
            res.send(result);
        });

    }

    finally {

    }

}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('Cricket lover server is running');
});

app.listen(port, () => console.log(`Cricket lover is running on ${port}`))



