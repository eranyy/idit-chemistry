const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/send-email', async (req, res) => {
    const { subject, fromName, name, email, message, target } = req.body;

    // Retrieve keys from environment variables securely
    const adminKey = process.env.WEB3FORMS_ADMIN_KEY;
    const iditKey = process.env.WEB3FORMS_IDIT_KEY;

    let accessKey;
    if (target === 'Admin') {
        accessKey = adminKey;
    } else if (target === 'Idit') {
        accessKey = iditKey;
    } else {
        return res.status(400).json({ error: 'Invalid target specified' });
    }

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key: accessKey,
                subject: subject,
                from_name: fromName,
                name: name,
                email: email,
                message: message
            })
        });

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text;
        }

        if (response.ok) {
            res.status(200).json({ success: true, data });
        } else {
            res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error('Error proxying Web3Forms API:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Fallback for SPA or unknown routes to index.html if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
