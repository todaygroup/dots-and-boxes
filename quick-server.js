const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const tutorials = [
    {
        id: "dots-basics-ages-4-6",
        targetAge: "4-6",
        title: "Learning to Connect Dots",
        description: "Introduction to basic game mechanics",
        estimatedTime: "5-7 minutes",
        steps: [
            { id: "intro", type: "explanation", title: "Welcome!" },
            { id: "first_line", type: "interactive", title: "Draw Your First Line" },
            { id: "make_box", type: "interactive", title: "Complete a Box" }
        ]
    },
    {
        id: "strategy-grades-3-4",
        targetAge: "9-10",
        title: "Advanced Strategy",
        description: "Learn chains, loops, and double-cross tactics",
        estimatedTime: "15-20 minutes",
        steps: [
            { id: "chain_intro", type: "explanation", title: "What is a Chain?" },
            { id: "chain_practice", type: "interactive", title: "Identify the Chain" }
        ]
    }
];

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/tutorials', (req, res) => res.json(tutorials));
app.post('/classrooms', (req, res) => {
    res.json({
        code: Math.floor(100000 + Math.random() * 900000),
        teacherId: req.body.teacherId,
        students: {},
        gameSessionIds: {},
        status: 'LOBBY'
    });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ API Server running on http://localhost:${PORT}`));
