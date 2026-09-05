require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/submit', async (req, res) => {
    try {
        const { target, subject, from_name, name, email, message } = req.body;

        let access_key;
        if (target === 'admin') {
            access_key = process.env.ADMIN_KEY;
        } else if (target === 'idit') {
            access_key = process.env.IDIT_KEY;
        } else {
            return res.status(400).json({ error: 'Invalid target specified' });
        }

        if (!access_key) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key,
                subject,
                from_name,
                name,
                email,
                message
            })
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json(data);
        } else {
            res.status(response.status).json(data);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
