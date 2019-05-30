const express = require('express')

const port = process.env.PORT || 3000
const app = express()

app.use(express.json())

app.get('/', (req,res) => {
    res.send('Hello from server')
})

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})