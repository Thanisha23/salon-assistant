import express from 'express'
import cors from 'cors'
import rootRouter from './routes'

const app = express()
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is running!')
})

app.use("/api/v1", rootRouter)

app.listen(5000,() => {
    console.log('Server is running on port 5000')
})