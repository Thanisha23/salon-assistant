import express from 'express'
import cors from 'cors'
import rootRouter from './routes'
import helpRequestsRouter from './routes/helpRequests.route'
import knowledgeRouter from './routes/knowledge.route'

const app = express()
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Backend is running!')
})

app.use("/api/v1/helpreq", helpRequestsRouter)

app.use("/api/v1/knowledge", knowledgeRouter)

app.listen(5000,() => {
    console.log('Server is running on port 5000')
})